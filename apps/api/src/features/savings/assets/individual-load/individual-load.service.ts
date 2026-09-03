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
  AporteRow,
  AssociateMovementResult,
  BankMovementResult,
  BulkRow,
  ContributionMovementType,
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
            contributionType:
              dto.movementType === 'EMPLOYER_CONTRIBUTION'
                ? 'EMPLOYER_CONTRIBUTION'
                : dto.movementType === 'SAVING_DIFFERENCE'
                  ? 'SAVING_DIFFERENCE'
                  : 'VOLUNTARY_SAVINGS',
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
    const isEmployerContribution =
      dto.movementType === 'EMPLOYER_CONTRIBUTION';
    const isSavingsDifference = dto.movementType === 'SAVING_DIFFERENCE';
    const differenceDateStr = (
      dto.transactionDate ?? new Date()
    )
      .toISOString()
      .split('T')[0];

    const accountingParams = buildContributionAccountingParams({
      movementType: resolveContributionMovementType(dto.movementType),
      entryDate: dto.transactionDate ?? new Date(),
      description:
        dto.description ||
        defaultLoadDescription(isEmployerContribution, ''),
      associateIds: [batch.associateId].filter((v): v is string => !!v),
      totalAmount: isEmployerContribution
        ? (dto.employerAmount ?? 0) + (dto.associateAmount ?? 0)
        : (dto.amount ?? 0),
      amountVoluntario: isEmployerContribution ? undefined : dto.amount,
      amountPatrono: isEmployerContribution
        ? dto.employerAmount
        : undefined,
      amountAsociado: isEmployerContribution
        ? dto.associateAmount
        : undefined,
      // Para la diferencia de ahorro, apuntamos explícitamente a
      // ASSOCIATED_SAVINGS (misma cuenta que el ahorro socio).
      items: isSavingsDifference
        ? [
            {
              associateId:
                (batch.associateId as string | null) ?? undefined,
              amounts: { ASSOCIATED_SAVINGS: dto.amount ?? 0 },
              descriptions: {
                ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${differenceDateStr}`,
              },
            } as AccountingItem,
          ]
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

    // ── Hoja 1: aportes ────────────────────────────────────────────────
    const aportes = workbook.addWorksheet('aportes');

    aportes.getCell('A1').value = 'tipo';
    aportes.getCell('B1').value = 'APORTE EMPLEADOS';
    aportes.getCell('A1').font = { bold: true };
    aportes.getCell('B1').font = { bold: true, color: { argb: 'FFFF0000' } };
    aportes.getCell('C1').value = 'fecha';
    aportes.getCell('D1').value = '2026-01-28';
    aportes.getCell('D1').font = { bold: true };

    aportes.getCell('A2').value = 'cedula';
    aportes.getCell('B2').value = 'aporte empleado';
    aportes.getCell('C2').value = 'aporte patrono';
    aportes.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    aportes.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };

    aportes.getColumn('A').width = 20;
    aportes.getColumn('B').width = 20;
    aportes.getColumn('C').width = 20;

    aportes.getCell('A3').value = '12345678';
    aportes.getCell('B3').value = 3000;
    aportes.getCell('C3').value = 2000;

    // ── Hoja 2: diferencias ────────────────────────────────────────────
    const diferencias = workbook.addWorksheet('diferencias');

    diferencias.getCell('A1').value = 'tipo';
    diferencias.getCell('B1').value = 'DIFERENCIA APORTE';
    diferencias.getCell('A1').font = { bold: true };
    diferencias.getCell('B1').font = { bold: true, color: { argb: 'FFFF0000' } };
    diferencias.getCell('C1').value = 'fecha';
    diferencias.getCell('D1').value = '2026-01-28';
    diferencias.getCell('D1').font = { bold: true };

    diferencias.getCell('A2').value = 'cedula';
    diferencias.getCell('B2').value = 'monto';
    diferencias.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    diferencias.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };

    diferencias.getColumn('A').width = 20;
    diferencias.getColumn('B').width = 20;

    diferencias.getCell('A3').value = '12345678';
    diferencias.getCell('B3').value = 500;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async createBulk(
    tenantId: string,
    userId: string,
    fileBuffer: Buffer,
    dto: BulkIndividualLoadDto,
  ): Promise<LoadResult> {
    const { aportesRows, diferenciasRows, validDate } =
      await this.parseBulkWorkbook(fileBuffer);

    if (aportesRows.length === 0 && diferenciasRows.length === 0) {
      throw new BadRequestException(
        'No se encontraron registros válidos en el archivo',
      );
    }

    const mouvementType: ContributionMovementType = 'contribution_patronal';
    const monthStr = this.formatBulkMonth(validDate);
    const yearStr = String(validDate.getFullYear());
    const dateStr = this.formatBulkDate(validDate);

    // === Transacción financiera atómica ===
    const { batch, processedCount, totalAmountProcessed, accountingItems } =
      await this.drizzle.transaction(async (tx) => {
        const movementDate = validDate;
        let processedCount = 0;
        let totalAmountProcessed = 0;
        const movementResults: AssociateMovementResult[] = [];
        const accountingItems: AccountingItem[] = [];

        // 2) Generar movimientos por cada fila válida de la hoja "aportes"
        for (const row of aportesRows) {
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

          if (row.aporteEmpleado > 0) {
            const resEmp = (await this.associateMovementsService.create(
              userId,
              {
                associateAccountId: associate.associateAccountId,
                movementType:
                  'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
                amount: row.aporteEmpleado,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: movementDate,
                description: `Ahorro Socio ${monthStr} ${yearStr}`,
                status: 'COMPLETED' as movementStatusEnum,
              },
              tenantId,
              tx,
            )) as AssociateMovementResult;
            movementResults.push(resEmp);
            totalAmountProcessed += row.aporteEmpleado;
            accountingItems.push({
              associateId: associate.id,
              contributionType: 'ASSOCIATED_SAVINGS',
              amounts: { ASSOCIATED_SAVINGS: row.aporteEmpleado },
              descriptions: {
                ASSOCIATED_SAVINGS: `AHORRO DEL ${dateStr}`,
              },
            });
          }

          if (row.aportePatrono > 0) {
            const resPat = (await this.associateMovementsService.create(
              userId,
              {
                associateAccountId: associate.associateAccountId,
                movementType:
                  'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
                amount: row.aportePatrono,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: movementDate,
                description: `Aporte Patrono ${monthStr} ${yearStr}`,
                status: 'COMPLETED' as movementStatusEnum,
              },
              tenantId,
              tx,
            )) as AssociateMovementResult;
            movementResults.push(resPat);
            totalAmountProcessed += row.aportePatrono;
            accountingItems.push({
              associateId: associate.id,
              contributionType: 'EMPLOYER_CONTRIBUTION',
              amounts: { EMPLOYER_CONTRIBUTION: row.aportePatrono },
              descriptions: {
                EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateStr}`,
              },
            });
          }

          processedCount++;
        }

        // 3) Generar movimientos de la hoja "diferencias"
        for (const row of diferenciasRows) {
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

          const resDes = (await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType:
                'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: movementDate,
              description: `DIFERENCIA AHORRO DEL SOCIO ${monthStr} ${yearStr}`,
              status: 'COMPLETED' as movementStatusEnum,
            },
            tenantId,
            tx,
          )) as AssociateMovementResult;

          movementResults.push(resDes);
          totalAmountProcessed += row.monto;
          accountingItems.push({
            associateId: associate.id,
            contributionType: 'SAVING_DIFFERENCE',
            amounts: { ASSOCIATED_SAVINGS: row.monto },
            descriptions: {
              ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${dateStr}`,
            },
          });

          processedCount++;
        }

        if (processedCount === 0) {
          throw new BadRequestException(
            'Ningún asociado especificado en el archivo fue encontrado o es válido.',
          );
        }

        const bulkDescription =
          dto.description ||
          `Carga masiva APORTE EMPLEADOS - ${processedCount} asociados`;

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
            contributionType: item.contributionType ?? 'ASSOCIATED_SAVINGS',
            amount:
              (item.amounts.ASSOCIATED_SAVINGS ?? 0) +
              (item.amounts.EMPLOYER_CONTRIBUTION ?? 0) +
              (item.amounts.VOLUNTARY_SAVINGS ?? 0),
          })),
        );

        // 4) Si hay datos bancarios -> transacción bancaria + referencias
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
              fallbackDescription: `Carga masiva: APORTE EMPLEADOS - ${processedCount} registros`,
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
        `Carga masiva APORTE EMPLEADOS - ${processedCount} asociados`,
      associateIds: accountingItems.map((item) => item.associateId),
      totalAmount: totalAmountProcessed,
      amountPatrono: undefined,
      amountAsociado: undefined,
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
  ): Promise<{
    aportesRows: AporteRow[];
    diferenciasRows: BulkRow[];
    validDate: Date;
  }> {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no se pudo leer correctamente.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const aportesSheet = workbook.getWorksheet('aportes');
    const diferenciasSheet = workbook.getWorksheet('diferencias');

    if (!aportesSheet || !diferenciasSheet) {
      throw new BadRequestException(
        'El archivo Excel debe contener las hojas "aportes" y "diferencias".',
      );
    }

    const readDate = (sheet: ExcelJS.Worksheet): Date => {
      const rawDateCell = sheet.getCell('D1').value;
      let validDate: Date;
      if (rawDateCell instanceof Date) {
        validDate = rawDateCell;
      } else {
        validDate = new Date(String(rawDateCell || ''));
      }
      if (isNaN(validDate.getTime()) || validDate.getFullYear() < 2000) {
        throw new BadRequestException(
          `La fecha en la celda D1 de la hoja "${sheet.name}" es inválida o muy antigua`,
        );
      }
      return validDate;
    };

    // Hoja 1: aportes
    const aportesType = String(
      aportesSheet.getCell('B1').value || '',
    ).trim();
    if (aportesType !== 'APORTE EMPLEADOS') {
      throw new BadRequestException(
        'El tipo de carga en la celda B1 de la hoja "aportes" debe ser APORTE EMPLEADOS',
      );
    }

    const validDate = readDate(aportesSheet);

    const aportesRows: AporteRow[] = [];
    aportesSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const cedula = String(row.getCell(1).value || '').trim();
      const aporteEmpleado = parseFloat(
        String(row.getCell(2).value || '0'),
      );
      const aportePatrono = parseFloat(
        String(row.getCell(3).value || '0'),
      );
      if (cedula && (aporteEmpleado > 0 || aportePatrono > 0)) {
        aportesRows.push({ cedula, aporteEmpleado, aportePatrono });
      }
    });

    // Hoja 2: diferencias
    const diferenciasType = String(
      diferenciasSheet.getCell('B1').value || '',
    ).trim();
    if (diferenciasType !== 'DIFERENCIA APORTE') {
      throw new BadRequestException(
        'El tipo en la celda B1 de la hoja "diferencias" debe ser DIFERENCIA APORTE',
      );
    }

    const diferenciasRows: BulkRow[] = [];
    diferenciasSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const cedula = String(row.getCell(1).value || '').trim();
      const monto = parseFloat(String(row.getCell(2).value || '0'));
      if (cedula && monto > 0) {
        diferenciasRows.push({ cedula, monto });
      }
    });

    return { aportesRows, diferenciasRows, validDate };
  }

  private formatBulkDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatBulkMonth(date: Date): string {
    return date.toLocaleString('es-ES', { month: 'long' });
  }
}
