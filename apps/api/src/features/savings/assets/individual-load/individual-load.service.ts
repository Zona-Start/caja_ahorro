import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  movementStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  BulkIndividualLoadDto,
  CreateIndividualLoadDto,
} from './dto/individual-load.zod.dto';
import { ContributionBatchesService } from '../contribution-batches/contribution-batches.service';

@Injectable()
export class IndividualLoadService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly associateMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly contributionBatchesService: ContributionBatchesService,
  ) { }

  async create(tenantId: string, userId: string, dto: CreateIndividualLoadDto) {
    return this.drizzle.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(schema.associateAccounts)
        .innerJoin(
          schema.associates,
          and(
            eq(schema.associateAccounts.associateId, schema.associates.id),
            eq(schema.associates.tenantId, tenantId),
          ),
        )
        .where(eq(schema.associateAccounts.id, dto.associateAccountId));

      if (!account || !account.associates?.id) {
        throw new NotFoundException('Cuenta de asociado no encontrada');
      }

      const isEmployerContribution =
        dto.movementType === 'EMPLOYER_CONTRIBUTION';
      const results: any[] = [];

      if (isEmployerContribution) {
        const patronalPayload = {
          associateAccountId: dto.associateAccountId,
          movementType: 'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
          amount: dto.employerAmount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate ?? new Date(),
          description: dto.description || 'Aporte Patronal',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const associatePayload = {
          associateAccountId: dto.associateAccountId,
          movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
          amount: dto.associateAmount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate ?? new Date(),
          description: dto.description || 'Aporte Asociado (Vía Patronal)',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const resultPatronal = await this.associateMovementsService.create(
          userId,
          patronalPayload,
          tenantId,
          tx,
        );
        const resultAsociado = await this.associateMovementsService.create(
          userId,
          associatePayload,
          tenantId,
          tx,
        );
        results.push(resultPatronal.data, resultAsociado.data);
      } else {
        const payload = {
          associateAccountId: dto.associateAccountId,
          movementType: dto.movementType as AssociateMovementTypeEnum,
          amount: dto.amount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate ?? new Date(),
          description: dto.description || 'Aporte Voluntario',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const result = await this.associateMovementsService.create(
          userId,
          payload,
          tenantId,
          tx,
        );
        results.push(result.data);
      }

      const totalAmount = isEmployerContribution
        ? (dto.employerAmount ?? 0) + (dto.associateAmount ?? 0)
        : (dto.amount ?? 0);

      const mainMovementId = results[0].internalCode;

      const hasBankingDetails =
        dto.bankAccountId && dto.paymentMethod && dto.referenceNumber;

      let bankTransactionId: string | undefined;

      if (hasBankingDetails) {
        const dataBank = {
          movement: {
            bankAccountId: dto.bankAccountId!,
            transactionDate: dto.transactionDate ?? new Date(),
            paymentMethod: dto.paymentMethod as paymentMethodEnum,
            description:
              dto.description ??
              `Abono a cuenta: ${account.associate_accounts.accountNumber}`,
            bankReference: dto.referenceNumber ?? undefined,
            category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
            creditAmount: totalAmount,
            debitAmount: 0,
            createdById: userId,
          },
          links: results.map((m) => ({
            internalRecordType: 'MEMBER_CONTRIBUTION' as const,
            internalRecordId: m.id,
          })),
        };

        const bankResult = await this.bankMovementsService.createAndReconcile(
          dataBank,
          userId,
          tenantId,
          tx,
        );

        bankTransactionId = bankResult.movement.id.toString();

        for (const m of results) {
          await tx
            .update(schema.associateAccountMovements)
            .set({
              referenceId: bankTransactionId,
              referenceType: 'BANK_TRANSACTION',
            })
            .where(eq(schema.associateAccountMovements.id, m.id));
        }
      }

      const bankDataForBatch = hasBankingDetails
        ? {
          bankAccountId: dto.bankAccountId,
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
        }
        : undefined;

      const batchResult =
        await this.contributionBatchesService.generateAndCreateBatch(
          tx,
          tenantId,
          userId,
          {
            type: 'individual',
            movementType: isEmployerContribution
              ? 'contribution_patronal'
              : 'contribution_voluntary',
            entryDate: dto.transactionDate ?? new Date(),
            associateId: account.associates.id,
            description:
              dto.description ||
              `${isEmployerContribution ? 'Carga Aportes Patronales' : 'Carga de haberes Voluntarios'} - ${account.associates.fullname}`,
            amountVoluntario: isEmployerContribution
              ? undefined
              : dto.amount,
            amountPatrono: isEmployerContribution
              ? dto.employerAmount
              : undefined,
            amountAsociado: isEmployerContribution
              ? dto.associateAmount
              : undefined,
            totalAmount,
            associateCount: 1,
            bankTransactionId,
            bankData: bankDataForBatch,
          },
          {
            movementType: isEmployerContribution
              ? 'contribution_patronal'
              : 'contribution_voluntary',
            entryDate: dto.transactionDate ?? new Date(),
            description:
              dto.description ||
              `${isEmployerContribution ? 'Carga Aportes Patronales' : 'Carga de haberes Voluntarios'} - ${account.associates.fullname}`,
            associateId: account.associates.id,
            totalAmount,
            amountVoluntario: isEmployerContribution ? undefined : dto.amount,
            amountPatrono: isEmployerContribution
              ? dto.employerAmount
              : undefined,
            amountAsociado: isEmployerContribution
              ? dto.associateAmount
              : undefined,
          },
          [{ associateId: account.associates.id, amount: totalAmount }],
        );

      return {
        message: batchResult.accountingWarning
          ? `Carga individual procesada exitosamente. Advertencia: ${batchResult.accountingWarning}`
          : 'Carga individual procesada exitosamente con su registro contable.',
        movementId: mainMovementId.toString(),
        accountingEntryId: batchResult.accountingEntryId,
        accountingWarning: batchResult.accountingWarning,
      };
    });
  }

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Carga Masiva');

    sheet.getCell('A1').value = 'tipo';
    sheet.getCell('B1').value = 'APORTE EMPLEADOS';
    sheet.getCell('A1').font = { bold: true };
    sheet.getCell('B1').font = { bold: true, color: { argb: 'FFFF0000' } };
    sheet.getCell('C1').value = 'fecha';
    sheet.getCell('D1').value = '1989-01-01';
    sheet.getCell('D1').font = { bold: true };

    sheet.getCell('A2').value = 'cedula';
    sheet.getCell('B2').value = 'monto';
    sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };

    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 20;

    sheet.getCell('A3').value = '12345678';
    sheet.getCell('B3').value = 5000;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async createBulk(
    tenantId: string,
    userId: string,
    fileBuffer: Buffer,
    dto: BulkIndividualLoadDto,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException(
        'El archivo Excel está vacío o es inválido',
      );
    }

    const typeCell = String(worksheet.getCell('B1').value || '').trim();
    if (typeCell !== 'APORTE EMPLEADOS' && typeCell !== 'DESCUENTOS CAJA') {
      throw new BadRequestException(
        'El tipo de carga en la celda B1 debe ser APORTE EMPLEADOS o DESCUENTOS CAJA',
      );
    }

    const rawDateCell = worksheet.getCell('D1').value;
    let validDate: Date;

    if (rawDateCell instanceof Date) {
      validDate = rawDateCell;
    } else {
      validDate = new Date(String(rawDateCell || ''));
    }

    if (isNaN(validDate.getTime()) || validDate.getFullYear() < 2000) {
      throw new BadRequestException(
        'La fecha en la celda D1 es inválida o muy antigua',
      );
    }

    const day = String(validDate.getDate()).padStart(2, '0');
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const year = validDate.getFullYear();
    const dateCell = `${day}-${month}-${year}`;

    const rows: { cedula: string; monto: number }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;

      const cedula = String(row.getCell(1).value || '').trim();
      const monto = parseFloat(String(row.getCell(2).value || '0'));

      if (cedula && monto > 0) {
        rows.push({ cedula, monto });
      }
    });

    if (rows.length === 0) {
      throw new BadRequestException(
        'No se encontraron registros válidos en el archivo',
      );
    }

    return this.drizzle.transaction(async (tx) => {
      let processedCount = 0;
      let totalAmountProcessed = 0;
      const resultsAssociateMovements: any[] = [];
      const accountingItems: Array<{
        associateId: string;
        amounts: { ASSOCIATED_SAVINGS: number; EMPLOYER_CONTRIBUTION?: number };
        descriptions?: Record<string, string>;
      }> = [];

      for (const row of rows) {
        const [associate] = await tx
          .select({
            id: schema.associates.id,
            associateAccountId: schema.associateAccounts.id,
          })
          .from(schema.associates)
          .where(
            and(
              eq(schema.associates.cedula, row.cedula),
              eq(schema.associates.tenantId, tenantId),
            ),
          )
          .leftJoin(
            schema.associateAccounts,
            eq(schema.associateAccounts.associateId, schema.associates.id),
          );

        if (!associate || !associate.associateAccountId) {
          continue;
        }

        if (typeCell === 'APORTE EMPLEADOS') {
          const resEmp = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aporte Patronales',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tenantId,
            tx,
          );
          resultsAssociateMovements.push(resEmp.data);
          const resPat = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType:
                'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aporte Patronales',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tenantId,
            tx,
          );
          resultsAssociateMovements.push(resPat.data);
          totalAmountProcessed += row.monto * 2;

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_SAVINGS: row.monto,
              EMPLOYER_CONTRIBUTION: row.monto,
            },
            descriptions: {
              ASSOCIATED_SAVINGS: `AHORRO DEL ${dateCell}`,
              EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateCell}`,
            },
          });
        } else if (typeCell === 'DESCUENTOS CAJA') {
          const resDes = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aportes Patronales - Diferencia Ahorro',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tenantId,
            tx,
          );
          resultsAssociateMovements.push(resDes.data);
          totalAmountProcessed += row.monto;

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_SAVINGS: row.monto,
            },
            descriptions: {
              ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${dateCell}`,
            },
          });
        }

        processedCount++;
      }

      let batchResult: Awaited<ReturnType<typeof this.contributionBatchesService.generateAndCreateBatch>> | undefined;

      if (processedCount > 0) {
        let bankResult: any = { movement: { id: '0' } };
        if (dto.bankAccountId && dto.paymentMethod && dto.referenceNumber) {
          const dataBankBulk = {
            movement: {
              bankAccountId: dto.bankAccountId,
              transactionDate: dto.transactionDate ?? new Date(),
              paymentMethod: dto.paymentMethod as paymentMethodEnum,
              description:
                dto.description ??
                `Carga masiva: ${typeCell} - ${processedCount} registros`,
              bankReference: dto.referenceNumber,
              category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
              creditAmount: totalAmountProcessed,
              debitAmount: 0,
              createdById: userId,
            },
            links: resultsAssociateMovements.map((m) => ({
              internalRecordType: 'MEMBER_CONTRIBUTION' as const,
              internalRecordId: m.id,
            })),
          };

          bankResult = await this.bankMovementsService.createAndReconcile(
            dataBankBulk,
            userId,
            tenantId,
            tx,
          );

          for (const m of resultsAssociateMovements) {
            await tx
              .update(schema.associateAccountMovements)
              .set({
                referenceId: bankResult.movement.id.toString(),
                referenceType: 'BANK_TRANSACTION',
              })
              .where(eq(schema.associateAccountMovements.id, m.id));
          }
        }

        const bulkBankTransactionId =
          dto.bankAccountId && dto.paymentMethod && dto.referenceNumber
            ? bankResult.movement.id.toString()
            : undefined;

        const bulkBankData =
          dto.bankAccountId && dto.paymentMethod && dto.referenceNumber
            ? {
              bankAccountId: dto.bankAccountId,
              paymentMethod: dto.paymentMethod,
              referenceNumber: dto.referenceNumber,
            }
            : undefined;

        const mouvementType: 'contribution_patronal' | 'contribution_voluntary' =
          typeCell === 'APORTE EMPLEADOS'
            ? 'contribution_patronal'
            : 'contribution_voluntary';

        batchResult =
          await this.contributionBatchesService.generateAndCreateBatch(
            tx,
            tenantId,
            userId,
            {
              type: 'massive',
              movementType: mouvementType,
              entryDate: dto.transactionDate ?? new Date(),
              description:
                dto.description ||
                `Carga masiva ${typeCell} - ${processedCount} asociados`,
              totalAmount: totalAmountProcessed,
              associateCount: processedCount,
              bankTransactionId: bulkBankTransactionId,
              bankData: bulkBankData,
            },
            {
              movementType: mouvementType,
              entryDate: dto.transactionDate ?? new Date(),
              description:
                dto.description ||
                `Carga masiva ${typeCell} - ${processedCount} asociados`,
              totalAmount: totalAmountProcessed,
              associateIds: accountingItems.map((item) => item.associateId),
              amountVoluntario:
                typeCell !== 'APORTE EMPLEADOS'
                  ? totalAmountProcessed
                  : undefined,
              amountPatrono:
                typeCell === 'APORTE EMPLEADOS'
                  ? totalAmountProcessed / 2
                  : undefined,
              amountAsociado:
                typeCell === 'APORTE EMPLEADOS'
                  ? totalAmountProcessed / 2
                  : undefined,
            },
            accountingItems.map((item) => ({
              associateId: item.associateId,
              amount: (item.amounts.ASSOCIATED_SAVINGS ?? 0) + (item.amounts.EMPLOYER_CONTRIBUTION ?? 0),
            })),
          );
      } else {
        throw new BadRequestException(
          'Ningún asociado especificado en el archivo fue encontrado o es válido.',
        );
      }

      return {
        message: batchResult?.accountingWarning
          ? `Proceso masivo completado. Advertencia: ${batchResult.accountingWarning}`
          : 'Proceso masivo completado',
        processedCount,
        accountingEntryId: batchResult?.accountingEntryId,
        accountingWarning: batchResult?.accountingWarning,
      };
    });
  }
}
