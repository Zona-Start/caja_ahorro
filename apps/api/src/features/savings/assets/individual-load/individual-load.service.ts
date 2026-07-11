import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  movementStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  ContributionBatchesAccountingService,
  type BatchAccountingParams,
} from '../contribution-batches/contribution-batches-accounting.service';
import { ContributionBatchesService } from '../contribution-batches/contribution-batches.service';
import {
  BulkIndividualLoadDto,
  CreateIndividualLoadDto,
} from './dto/individual-load.zod.dto';
import { buildContributionAccountingParams } from './lib/individual-load-accounting';
import {
  buildAssociateMovementPayloads,
  buildBankMovementPayload,
  buildCreateBatchDto,
  buildIndividualAssociateEntries,
  defaultLoadDescription,
  extractBankTransactionId,
  resolveContributionMovementType,
} from './lib/individual-load-payloads';
import type {
  AccountingItem,
  AccountingOutcome,
  AssociateMovementResult,
  BankMovementResult,
  BulkRow,
  LoadResult,
} from './schemas/individual-load.types';

@Injectable()
export class IndividualLoadService {
  private readonly logger = new Logger(IndividualLoadService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly associateMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly contributionBatchesService: ContributionBatchesService,
    private readonly contributionAccountingService: ContributionBatchesAccountingService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  // Carga individual
  // ──────────────────────────────────────────────────────────────────────

  async create(
    tenantId: string,
    userId: string,
    dto: CreateIndividualLoadDto,
  ): Promise<LoadResult> {
    // === Transacción financiera atómica ===
    const { batch, mainMovementId } = await this.drizzle.transaction(
      async (tx) => {
        // 1) Validar existencia de la cuenta del asociado (con tenant)
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
        const movementType = resolveContributionMovementType(dto.movementType);
        const totalAmount = isEmployerContribution
          ? (dto.employerAmount ?? 0) + (dto.associateAmount ?? 0)
          : (dto.amount ?? 0);

        const batchDescription =
          dto.description ||
          defaultLoadDescription(
            isEmployerContribution,
            account.associates.fullname,
          );

        // 2) Registrar el lote + detalle (sin asiento contable aún)
        const batch = await this.contributionBatchesService.createBatchRecord(
          tx,
          tenantId,
          userId,
          buildCreateBatchDto({
            type: 'individual',
            movementType,
            entryDate: dto.transactionDate ?? new Date(),
            description: dto.description,
            fallbackDescription: batchDescription,
            associateId: account.associates.id,
            amountVoluntario: isEmployerContribution ? undefined : dto.amount,
            amountPatrono: isEmployerContribution
              ? dto.employerAmount
              : undefined,
            amountAsociado: isEmployerContribution
              ? dto.associateAmount
              : undefined,
            totalAmount,
            associateCount: 1,
          }),
          buildIndividualAssociateEntries({
            associateId: account.associates.id,
            totalAmount,
          }),
        );

        // 3) Generar los movimientos en la cuenta del asociado
        const movementPayloads = buildAssociateMovementPayloads(
          {
            associateAccountId: dto.associateAccountId,
            movementType: dto.movementType,
            amount: dto.amount,
            employerAmount: dto.employerAmount,
            associateAmount: dto.associateAmount,
            transactionDate: dto.transactionDate,
            description: dto.description,
          },
          defaultLoadDescription(
            isEmployerContribution,
            account.associates.fullname,
          ),
        );

        const results: AssociateMovementResult[] = [];
        for (const payload of movementPayloads) {
          const result = (await this.associateMovementsService.create(
            userId,
            payload,
            tenantId,
            tx,
          )) as AssociateMovementResult;
          results.push(result);
        }

        const mainMovementId = results[0]?.data.internalCode;

        // 4) Si hay datos bancarios -> crear la transacción bancaria y referenciar
        const hasBankingDetails =
          !!dto.bankAccountId && !!dto.paymentMethod && !!dto.referenceNumber;

        if (hasBankingDetails) {
          const bankPayload = buildBankMovementPayload(
            {
              bankAccountId: dto.bankAccountId!,
              transactionDate: dto.transactionDate ?? new Date(),
              paymentMethod: dto.paymentMethod as paymentMethodEnum,
              referenceNumber: dto.referenceNumber ?? undefined,
              description: dto.description,
              fallbackDescription: `Abono a cuenta: ${account.associate_accounts.accountNumber}`,
              creditAmount: totalAmount,
            },
            results,
            userId,
          );

          const bankResult =
            (await this.bankMovementsService.createAndReconcile(
              bankPayload,
              userId,
              tenantId,
              tx,
            )) as BankMovementResult;

          const bankTransactionId = extractBankTransactionId(bankResult);

          // Bulk update de referencia en los movimientos del asociado
          await tx
            .update(schema.associateAccountMovements)
            .set({
              referenceId: bankTransactionId,
              referenceType: 'BANK_TRANSACTION',
            })
            .where(
              inArray(
                schema.associateAccountMovements.id,
                results.map((r) => r.data.id),
              ),
            );

          // Actualizar el lote con la transacción bancaria generada
          await this.contributionBatchesService.updateBatchReferences(
            tx,
            batch.id,
            {
              bankTransactionId,
            },
          );
        }

        // 5) Auditoría financiera (dentro de la tx)
        this.contributionBatchesService.emitAuditLog(batch, userId, 'INSERT');

        return { batch, mainMovementId };
      },
    );

    // === Asiento contable de seguimiento (Opción B: tx propia post-commit) ===
    const accountingParams = buildContributionAccountingParams({
      movementType: resolveContributionMovementType(dto.movementType),
      entryDate: dto.transactionDate ?? new Date(),
      description:
        dto.description ||
        defaultLoadDescription(
          dto.movementType === 'EMPLOYER_CONTRIBUTION',
          '',
        ),
      associateIds: [batch.associateId].filter((v): v is string => !!v),
      totalAmount:
        dto.movementType === 'EMPLOYER_CONTRIBUTION'
          ? (dto.employerAmount ?? 0) + (dto.associateAmount ?? 0)
          : (dto.amount ?? 0),
      amountVoluntario:
        dto.movementType === 'EMPLOYER_CONTRIBUTION' ? undefined : dto.amount,
      amountPatrono:
        dto.movementType === 'EMPLOYER_CONTRIBUTION'
          ? dto.employerAmount
          : undefined,
      amountAsociado:
        dto.movementType === 'EMPLOYER_CONTRIBUTION'
          ? dto.associateAmount
          : undefined,
    });

    const accounting = await this.attemptAccountingEntry(
      tenantId,
      userId,
      batch.id,
      accountingParams,
    );

    return {
      message: accounting.warning
        ? `Carga individual procesada exitosamente. Advertencia contable: ${accounting.warning}`
        : 'Carga individual procesada exitosamente con su registro contable.',
      movementId: mainMovementId?.toString(),
      accountingEntryId: accounting.entryId,
      accountingWarning: accounting.warning,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Carga masiva
  // ──────────────────────────────────────────────────────────────────────

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
  ): Promise<LoadResult> {
    const { typeCell, validDate, rows } =
      await this.parseBulkWorkbook(fileBuffer);
    if (typeCell !== 'APORTE EMPLEADOS' && typeCell !== 'DESCUENTOS CAJA') {
      throw new BadRequestException(
        'El tipo de carga en la celda B1 debe ser APORTE EMPLEADOS o DESCUENTOS CAJA',
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException(
        'No se encontraron registros válidos en el archivo',
      );
    }

    const isPatronal = typeCell === 'APORTE EMPLEADOS';
    const mouvementType = isPatronal
      ? 'contribution_patronal'
      : 'contribution_voluntary';

    // === Transacción financiera atómica ===
    const { batch, processedCount, totalAmountProcessed, accountingItems } =
      await this.drizzle.transaction(async (tx) => {
        const movementDate = validDate;
        const dateStr = this.formatBulkDate(movementDate);
        let processedCount = 0;
        let totalAmountProcessed = 0;
        const movementResults: AssociateMovementResult[] = [];
        const accountingItems: AccountingItem[] = [];
        const processedAssociateIds: string[] = [];

        // 2) Generar movimientos por cada row válida
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

          if (isPatronal) {
            const resEmp = (await this.associateMovementsService.create(
              userId,
              {
                associateAccountId: associate.associateAccountId,
                movementType:
                  'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
                amount: row.monto,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: movementDate,
                description: 'Aporte Patronales',
                status: 'COMPLETED' as movementStatusEnum,
              },
              tenantId,
              tx,
            )) as AssociateMovementResult;

            const resPat = (await this.associateMovementsService.create(
              userId,
              {
                associateAccountId: associate.associateAccountId,
                movementType:
                  'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
                amount: row.monto,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: movementDate,
                description: 'Aporte Patronales',
                status: 'COMPLETED' as movementStatusEnum,
              },
              tenantId,
              tx,
            )) as AssociateMovementResult;

            movementResults.push(resEmp, resPat);
            totalAmountProcessed += row.monto * 2;
            accountingItems.push({
              associateId: associate.id,
              amounts: {
                ASSOCIATED_SAVINGS: row.monto,
                EMPLOYER_CONTRIBUTION: row.monto,
              },
              descriptions: {
                ASSOCIATED_SAVINGS: `AHORRO DEL ${dateStr}`,
                EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateStr}`,
              },
            });
          } else {
            const resDes = (await this.associateMovementsService.create(
              userId,
              {
                associateAccountId: associate.associateAccountId,
                movementType:
                  'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
                amount: row.monto,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: movementDate,
                description: 'Aportes Patronales - Diferencia Ahorro',
                status: 'COMPLETED' as movementStatusEnum,
              },
              tenantId,
              tx,
            )) as AssociateMovementResult;

            movementResults.push(resDes);
            totalAmountProcessed += row.monto;
            accountingItems.push({
              associateId: associate.id,
              amounts: {
                ASSOCIATED_SAVINGS: row.monto,
              },
              descriptions: {
                ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${dateStr}`,
              },
            });
          }

          processedAssociateIds.push(associate.id);
          processedCount++;
        }

        if (processedCount === 0) {
          throw new BadRequestException(
            'Ningún asociado especificado en el archivo fue encontrado o es válido.',
          );
        }

        const bulkDescription =
          dto.description ||
          `Carga masiva ${typeCell} - ${processedCount} asociados`;

        // 1) Registrar el lote + detalle (sin asiento contable ni banco aún)
        const batch = await this.contributionBatchesService.createBatchRecord(
          tx,
          tenantId,
          userId,
          buildCreateBatchDto({
            type: 'massive',
            movementType: mouvementType,
            entryDate: movementDate,
            description: dto.description,
            fallbackDescription: bulkDescription,
            totalAmount: totalAmountProcessed,
            associateCount: processedCount,
          }),
          accountingItems.map((item) => ({
            associateId: item.associateId,
            amount:
              (item.amounts.ASSOCIATED_SAVINGS ?? 0) +
              (item.amounts.EMPLOYER_CONTRIBUTION ?? 0),
          })),
        );

        // 3) Si hay datos bancarios -> transacción bancaria + referencias
        const hasBankingDetails =
          !!dto.bankAccountId && !!dto.paymentMethod && !!dto.referenceNumber;

        if (hasBankingDetails) {
          const bankPayload = buildBankMovementPayload(
            {
              bankAccountId: dto.bankAccountId!,
              transactionDate: movementDate,
              paymentMethod: dto.paymentMethod as paymentMethodEnum,
              referenceNumber: dto.referenceNumber ?? undefined,
              description: dto.description,
              fallbackDescription: `Carga masiva: ${typeCell} - ${processedCount} registros`,
              creditAmount: totalAmountProcessed,
            },
            movementResults,
            userId,
          );

          const bankResult =
            (await this.bankMovementsService.createAndReconcile(
              bankPayload,
              userId,
              tenantId,
              tx,
            )) as BankMovementResult;

          const bankTransactionId = extractBankTransactionId(bankResult);

          await tx
            .update(schema.associateAccountMovements)
            .set({
              referenceId: bankTransactionId,
              referenceType: 'BANK_TRANSACTION',
            })
            .where(
              inArray(
                schema.associateAccountMovements.id,
                movementResults.map((r) => r.data.id),
              ),
            );

          await this.contributionBatchesService.updateBatchReferences(
            tx,
            batch.id,
            { bankTransactionId },
          );
        }

        // 5) Auditoría financiera
        this.contributionBatchesService.emitAuditLog(batch, userId, 'INSERT');

        return {
          batch,
          processedCount,
          totalAmountProcessed,
          accountingItems,
        };
      });

    // === Asiento contable de seguimiento (Opción B) ===
    const accountingParams = buildContributionAccountingParams({
      movementType: mouvementType,
      entryDate: validDate,
      description:
        dto.description ||
        `Carga masiva ${typeCell} - ${processedCount} asociados`,
      associateIds: accountingItems.map((item) => item.associateId),
      totalAmount: totalAmountProcessed,
      amountVoluntario: isPatronal ? undefined : totalAmountProcessed,
      amountPatrono: isPatronal ? totalAmountProcessed / 2 : undefined,
      amountAsociado: isPatronal ? totalAmountProcessed / 2 : undefined,
      items: accountingItems,
    });

    const accounting = await this.attemptAccountingEntry(
      tenantId,
      userId,
      batch.id,
      accountingParams,
    );

    return {
      message: accounting.warning
        ? `Proceso masivo completado. Advertencia contable: ${accounting.warning}`
        : 'Proceso masivo completado',
      processedCount,
      accountingEntryId: accounting.entryId,
      accountingWarning: accounting.warning,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Ejecuta la generación del asiento contable en SU PROPIA transacción,
   * independiente de la transacción financiera ya commiteada (Opción B).
   *
   * Política no-fatal: si la regla contable no existe o hay cualquier
   * error al generar el asiento, NO se lanza la excepción. En su lugar
   * se devuelve `{ warning }` con el mensaje, preservando la consistencia
   * de la operación financiera ya persistida.
   *
   * Si la generación es exitosa, actualiza `accountingEntryId` del lote
   * dentro de la misma transacción contable.
   */
  private async attemptAccountingEntry(
    tenantId: string,
    userId: string,
    batchId: string,
    accountingParams: BatchAccountingParams,
  ): Promise<AccountingOutcome> {
    try {
      return await this.drizzle.transaction(async (acctTx) => {
        const outcome =
          await this.contributionAccountingService.generateContributionEntry(
            tenantId,
            userId,
            accountingParams,
            batchId,
            acctTx,
          );

        if (outcome.entryId) {
          await this.contributionBatchesService.updateBatchReferences(
            acctTx,
            batchId,
            { accountingEntryId: outcome.entryId },
          );
        }

        return outcome;
      });
    } catch (fatal) {
      const message =
        fatal instanceof Error ? fatal.message : 'Error desconocido';
      this.logger.error(
        `Tx contable post-commit falló para batch ${batchId}: ${message}`,
      );
      return {
        warning: `Error inesperado al generar el asiento contable: ${message}`,
      };
    }
  }

  private async parseBulkWorkbook(
    fileBuffer: Buffer,
  ): Promise<{ typeCell: string; validDate: Date; rows: BulkRow[] }> {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no se pudo leer correctamente.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException(
        'El archivo Excel está vacío o es inválido',
      );
    }

    const typeCell = String(worksheet.getCell('B1').value || '').trim();

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

    const rows: BulkRow[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const cedula = String(row.getCell(1).value || '').trim();
      const monto = parseFloat(String(row.getCell(2).value || '0'));
      if (cedula && monto > 0) {
        rows.push({ cedula, monto });
      }
    });

    return { typeCell, validDate, rows };
  }

  private formatBulkDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
