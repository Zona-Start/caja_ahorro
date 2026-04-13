import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associates,
  associateAccounts,
  loans,
  loanStatusHistory,
  loanTypes,
  paymentBatches,
  paymentBatchItems,
} from '@/database/index';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogsService } from '@/features/audit/audit-logs/audit-logs.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import {
  ActionEnumAudit,
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  LoanStatusEnum,
  movementStatusEnum,
  paymentBatchItemStatus,
  paymentBatchStatus,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq, inArray, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { ConfirmLoanDisbursementBatchDto } from './dto/confirm-loan-disbursement-batch.dto';
import { DisburseBatchLoansDto } from './dto/disburse-batch-loans.dto';
import { DisburseIndividualLoanDto } from './dto/disburse-loan.dto';

/** Tipo del lote de la tabla payment_batches */
const BATCH_TYPE_LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT';

@Injectable()
export class LoanDisbursementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly assocMvts: AssociateAccountsMovementsService,
    private readonly bankMvts: BankMovementsService,
    private readonly audit: AuditLogsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  /** Valida y obtiene los datos del préstamo necesarios para el desembolso */
  private async getLoanDataForDisbursement(
    loanId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const [row] = await tx
      .select({
        id: loans.id,
        status: loans.status,
        associateId: loans.associateId,
        loanTypeId: loans.loanTypeId,
        approvedAmount: loans.approvedAmount,
        expensesAmount: loans.expensesAmount,
        currencyCode: loans.currencyCode,
        companyId: loans.companyId,
        disbursementAccountId: loans.disbursementAccountId,
        // Datos del tipo de préstamo
        loanTypeName: loanTypes.name,
        // Datos del asociado
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        associateNationality: associates.nationality,
        // Cuenta del asociado
        associateAccountId: associateAccounts.id,
        associateAccountNumber: associateAccounts.accountNumber,
      })
      .from(loans)
      .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, loans.associateId),
      )
      .where(eq(loans.id, loanId));

    if (!row) throw new NotFoundException(`Préstamo ${loanId} no encontrado`);
    if (row.status !== LoanStatusEnum.APPROVED)
      throw new BadRequestException(
        `El préstamo ${loanId} no está en estado APROBADO`,
      );

    return row;
  }

  /** Genera el asiento contable automático al desembolsar un préstamo */
  private async generateDisbursementAccountingEntry(
    userId: number,
    loanData: {
      id: number;
      companyId: number;
      associateId: number;
      associateCedula: string | null;
      associateFullname: string | null;
      loanTypeName: string | null;
      approvedAmount: string | null;
      expensesAmount: string | null;
      currencyCode: string | null;
    },
    disbursementDate: Date,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const approvedAmount = Number(loanData.approvedAmount ?? 0);
    const expensesAmount = Number(loanData.expensesAmount ?? 0);
    // El capital desembolsado = approvedAmount (sin descontar gastos, éstos se cobran en cuotas)
    const principalAmount = approvedAmount;

    const loanTypeName = loanData.loanTypeName ?? 'PRÉSTAMO';
    const cedula = loanData.associateCedula ?? '';
    const fullname = loanData.associateFullname ?? '';
    const dateStr = disbursementDate.toISOString().split('T')[0];

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        userId,
        {
          companyId: Number(loanData.companyId),
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_TYPE',
          description: `Desembolso de Préstamo - ${fullname}`,
          entryDate: disbursementDate,
          referenceValue: 'Prestamos Personales (CP)',
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_DISBURSEMENT',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PRINCIPAL: principalAmount,
                SERVICE_FEE_INCOME: expensesAmount,
                BANK_ACCOUNT: principalAmount - expensesAmount,
              },
              descriptions: {
                LOAN_PRINCIPAL: loanTypeName,
                SERVICE_FEE_INCOME: `GASTOS ${loanTypeName}`,
                BANK_ACCOUNT: `TB ${cedula} ${fullname}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PRINCIPAL: `${loanTypeName} DEL ${dateStr}`,
            SERVICE_FEE_INCOME: `GASTOS ${loanTypeName} DEL ${dateStr}`,
            BANK_ACCOUNT: `TB ${cedula} ${fullname} DEL ${dateStr}`,
          },
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          `El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar el desembolso del préstamo. Por favor, contacte al administrador.`,
        );
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DESEMBOLSO INDIVIDUAL
  // ─────────────────────────────────────────────────────────────

  /**
   * Desembolsa un préstamo individualmente:
   * 1. Valida que esté APPROVED
   * 2. Registra movimiento bancario (egreso)
   * 3. Acredita al asociado
   * 4. Genera asiento contable automático
   * 5. Cambia estado del préstamo a DISBURSED
   * 6. Auditoría
   */
  async disburseIndividual(
    dto: DisburseIndividualLoanDto,
    userId: number,
  ): Promise<{ loanId: number; message: string }> {
    return this.db.transaction(async (tx) => {
      const loanData = await this.getLoanDataForDisbursement(dto.loanId, tx);

      const netAmount = Number(loanData.approvedAmount ?? 0);
      const assocAccId =
        loanData.disbursementAccountId ?? loanData.associateAccountId;

      if (!assocAccId) {
        throw new BadRequestException(
          `El préstamo ${dto.loanId} no tiene cuenta de desembolso configurada`,
        );
      }

      // 1. Movimiento bancario (egreso)
      await this.bankMvts.createAndReconcile(
        {
          movement: {
            bankAccountId: dto.bankAccountId,
            transactionDate: dto.disbursementDate,
            paymentMethod: dto.paymentMethod,
            description:
              dto.description ??
              `DESEMBOLSO PRÉSTAMO - ${loanData.associateFullname}`,
            bankReference: dto.bankReference,
            category: 'BATCH_DISBURSEMENT' as BankTransactionCategory,
            creditAmount: 0,
            debitAmount: netAmount,
            createdById: userId,
          },
          links: [
            {
              internalRecordType: 'LOAN_DISBURSEMENT',
              internalRecordId: dto.loanId,
            },
          ],
        },
        userId,
        tx,
      );

      // 2. Movimiento interno (crédito al asociado)
      await this.assocMvts.create(
        userId,
        {
          associateAccountId: assocAccId,
          movementType: AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT,
          amount: netAmount,
          currencyCode: dto.currencyCode,
          transactionDate: dto.disbursementDate,
          description: `DESEMBOLSO PRÉSTAMO - REF: ${dto.bankReference ?? 'N/A'}`,
          referenceId: String(dto.loanId),
          referenceType: 'loans',
          area: 'PRESTAMOS',
          status: 'COMPLETED' as movementStatusEnum,
        },
        tx,
      );

      // 3. Asiento contable automático
      await this.generateDisbursementAccountingEntry(
        userId,
        loanData,
        dto.disbursementDate,
        tx,
      );

      // 4. Cambiar estado del préstamo a DISBURSED
      await tx
        .update(loans)
        .set({
          status: LoanStatusEnum.DISBURSED,
          disbursementDate: dto.disbursementDate.toISOString().split('T')[0],
          disbursedByUserId: userId,
          disbursedAmount: String(netAmount),
        })
        .where(eq(loans.id, dto.loanId));

      // 5. Registrar historial de estatus
      await tx.insert(loanStatusHistory).values({
        loanId: dto.loanId,
        status: LoanStatusEnum.DISBURSED,
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Desembolso individual',
      });

      // 6. Auditoría
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'PRESTAMOS',
          description: 'DESEMBOLSO INDIVIDUAL DE PRÉSTAMO',
          recordId: String(dto.loanId),
          tableName: 'loans',
          userId: Number(userId),
        },
        tx,
      );

      return { loanId: dto.loanId, message: 'Préstamo desembolsado exitosamente' };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DESEMBOLSO EN LOTE — CREACIÓN DEL LOTE
  // ─────────────────────────────────────────────────────────────

  /**
   * Crea un lote de desembolso de préstamos (estado DRAFT).
   * Reutiliza la tabla `payment_batches` con batchType='LOAN_DISBURSEMENT'.
   */
  async createDisbursementBatch(
    dto: DisburseBatchLoansDto,
    userId: number,
  ): Promise<{ id: number; recordCount: number; totalAmount: string }> {
    return this.db.transaction(async (tx) => {
      const lines: (typeof schema.paymentBatchItems.$inferInsert)[] = [];
      let totalAmount = 0;

      for (const item of dto.items) {
        const loanData = await this.getLoanDataForDisbursement(item.loanId, tx);

        const netAmount = Number(loanData.approvedAmount ?? 0);
        const assocAccId =
          loanData.disbursementAccountId ?? loanData.associateAccountId;

        if (!assocAccId) {
          throw new BadRequestException(
            `El préstamo ${item.loanId} no tiene cuenta de desembolso configurada`,
          );
        }

        // Verificar que no esté ya en un lote activo
        const dup = await tx.query.paymentBatchItems.findFirst({
          where: and(
            eq(schema.paymentBatchItems.sourceId, item.loanId),
            eq(schema.paymentBatchItems.itemType, 'LOAN'),
            sql`${schema.paymentBatchItems.paymentBatchId} in (
              select id from ${schema.paymentBatches}
              where status not in ('PROCESSED','CANCELLED')
              and batch_type = '${sql.raw(BATCH_TYPE_LOAN_DISBURSEMENT)}'
            )`,
          ),
        });

        if (dup) {
          throw new BadRequestException(
            `El préstamo ${item.loanId} ya está en otro lote de desembolso activo`,
          );
        }

        const nationality = (loanData.associateNationality as string)?.[0] ?? '';
        const beneficiaryId = `${nationality}${loanData.associateCedula ?? ''}`;

        totalAmount += netAmount;

        lines.push({
          paymentBatchId: 0, // se rellena después
          itemType: 'LOAN',
          sourceId: item.loanId,
          associateAccountId: assocAccId,
          beneficiaryAccountNumber: loanData.associateAccountNumber ?? '',
          beneficiaryAccountType: 'CORRIENTE',
          beneficiaryId,
          beneficiaryName: loanData.associateFullname ?? '',
          amount: netAmount.toFixed(4),
          status: paymentBatchItemStatus.PENDING,
        });
      }

      // Insertar cabecera del lote
      const [batch] = await tx
        .insert(schema.paymentBatches)
        .values({
          companyId: 1, // TODO: desde contexto
          bankId: dto.bankAccountId,
          currencyCode: dto.currencyCode,
          recordCount: lines.length,
          totalAmount: totalAmount.toFixed(4),
          status: paymentBatchStatus.DRAFT,
          description: dto.description ?? 'Lote de desembolso de préstamos',
          createdById: userId,
          batchType: BATCH_TYPE_LOAN_DISBURSEMENT,
          paymentBatchReference:
            await this.generateCodeService.generateNextReference('LOT-D'),
        } as any)
        .returning();

      // Insertar líneas
      if (lines.length > 0) {
        await tx
          .insert(schema.paymentBatchItems)
          .values(lines.map((l) => ({ ...l, paymentBatchId: batch.id })));
      }

      return {
        id: batch.id,
        recordCount: batch.recordCount,
        totalAmount: batch.totalAmount!,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DESEMBOLSO EN LOTE — CONFIRMACIÓN
  // ─────────────────────────────────────────────────────────────

  /**
   * Confirma el procesamiento del lote de desembolso de préstamos.
   * Por cada ítem PROCESSED:
   *   1. Movimiento bancario (egreso)
   *   2. Crédito al asociado
   *   3. Asiento contable automático
   *   4. Cambia estado del préstamo a DISBURSED
   */
  async confirmDisbursementBatch(
    batchId: number,
    dto: ConfirmLoanDisbursementBatchDto,
    userId: number,
  ): Promise<{ message: string }> {
    await this.db.transaction(async (tx) => {
      // 1. Obtener lote y validar
      const batch = await tx.query.paymentBatches.findFirst({
        where: and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.status, paymentBatchStatus.UPLOADED),
        ),
      });
      if (!batch) {
        throw new NotFoundException(
          `Lote ${batchId} no encontrado o no está en estado UPLOADED`,
        );
      }

      const items = await tx.query.paymentBatchItems.findMany({
        where: eq(schema.paymentBatchItems.paymentBatchId, batchId),
      });

      let allRejected = true;

      for (const it of items) {
        const res = dto.items.find((i) => i.itemId === it.id);
        if (!res) {
          throw new BadRequestException(`Falta resultado para el ítem ${it.id}`);
        }

        // Actualizar estado del ítem
        await tx
          .update(schema.paymentBatchItems)
          .set({
            status:
              res.status === 'PROCESSED'
                ? paymentBatchItemStatus.PROCESSED
                : paymentBatchItemStatus.REJECTED,
            rejectionReason: res.reason ?? null,
          })
          .where(eq(schema.paymentBatchItems.id, it.id));

        if (res.status !== 'PROCESSED') continue;
        allRejected = false;

        // Obtener datos del préstamo
        const loanData = await this.getLoanDataForDisbursement(it.sourceId, tx);
        const netAmount = Number(it.amount);
        const assocAccId =
          loanData.disbursementAccountId ?? loanData.associateAccountId;

        if (!assocAccId) continue;

        // 2. Movimiento bancario (egreso)
        await this.bankMvts.createAndReconcile(
          {
            movement: {
              bankAccountId: Number(batch.bankId),
              transactionDate: new Date(dto.processedAt),
              paymentMethod: paymentMethodEnum.BANK_TRANSFER,
              description: `PAGO POR LOTE DESEMBOLSO ${batchId}`,
              bankReference: dto.bankReference,
              category: 'BATCH_DISBURSEMENT' as BankTransactionCategory,
              creditAmount: 0,
              debitAmount: netAmount,
              createdById: userId,
            },
            links: [
              {
                internalRecordType: 'LOAN_DISBURSEMENT',
                internalRecordId: it.sourceId,
              },
            ],
          },
          userId,
          tx,
        );

        // 3. Crédito al asociado
        await this.assocMvts.create(
          userId,
          {
            associateAccountId: assocAccId,
            movementType: AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT,
            amount: netAmount,
            currencyCode: batch.currencyCode as CurrencyCodeEnum,
            transactionDate: new Date(dto.processedAt),
            description: `DESEMBOLSO LOTE ${batchId} - REF: ${dto.bankReference ?? 'N/A'}`,
            referenceId: String(batchId),
            referenceType: 'payment_batch',
            area: 'PRESTAMOS',
            status: 'COMPLETED' as movementStatusEnum,
          },
          tx,
        );

        // 4. Asiento contable automático
        await this.generateDisbursementAccountingEntry(
          userId,
          loanData,
          new Date(dto.processedAt),
          tx,
        );

        // 5. Cambiar estado del préstamo a DISBURSED
        await tx
          .update(loans)
          .set({
            status: LoanStatusEnum.DISBURSED,
            disbursementDate: new Date(dto.processedAt)
              .toISOString()
              .split('T')[0],
            disbursedByUserId: userId,
            disbursedAmount: String(netAmount),
          })
          .where(eq(loans.id, it.sourceId));

        // 6. Historial de estatus
        await tx.insert(loanStatusHistory).values({
          loanId: it.sourceId,
          status: LoanStatusEnum.DISBURSED,
          changedAt: new Date(),
          changedByUserId: userId,
          comment: `Desembolsado en lote ${batchId}`,
        });
      }

      // 7. Actualizar estado del lote
      const finalStatus = allRejected
        ? paymentBatchStatus.CANCELLED
        : paymentBatchStatus.PROCESSED;

      await tx
        .update(schema.paymentBatches)
        .set({
          status: finalStatus,
          bankReference: dto.bankReference ?? null,
          processedAt: new Date(dto.processedAt),
        })
        .where(eq(schema.paymentBatches.id, batchId));

      // 8. Auditoría del lote
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'PRESTAMOS',
          description: 'CONFIRMACIÓN LOTE DESEMBOLSO PRÉSTAMOS',
          recordId: String(batchId),
          tableName: 'payment_batches',
          userId: Number(userId),
          newData: [finalStatus],
        },
        tx,
      );
    });

    return { message: 'Lote de desembolso procesado exitosamente' };
  }

  // ─────────────────────────────────────────────────────────────
  // MARCAR COMO UPLOADED
  // ─────────────────────────────────────────────────────────────

  async markAsUploaded(
    batchId: number,
    userId: number,
  ): Promise<{ id: number; status: string }> {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: and(
        eq(schema.paymentBatches.id, batchId),
        eq(schema.paymentBatches.status, paymentBatchStatus.DRAFT),
      ),
    });

    if (!batch) {
      throw new NotFoundException(
        `Lote ${batchId} no encontrado o no está en DRAFT`,
      );
    }

    const [updated] = await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.UPLOADED })
      .where(eq(schema.paymentBatches.id, batchId))
      .returning({ id: schema.paymentBatches.id, status: schema.paymentBatches.status });

    await this.audit.create({
      action: 'PROCESS_EXECUTION' as ActionEnumAudit,
      area: 'PRESTAMOS',
      description: 'LOTE DESEMBOLSO MARCADO COMO UPLOADED',
      recordId: String(batchId),
      tableName: 'payment_batches',
      userId: Number(userId),
    });

    return { id: updated.id, status: updated.status };
  }

  // ─────────────────────────────────────────────────────────────
  // CANCELAR LOTE
  // ─────────────────────────────────────────────────────────────

  async cancelBatch(
    batchId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: eq(schema.paymentBatches.id, batchId),
    });

    if (!batch) throw new NotFoundException(`Lote ${batchId} no encontrado`);
    if (!['DRAFT', 'UPLOADED'].includes(batch.status)) {
      throw new BadRequestException(
        'Solo se puede cancelar un lote en DRAFT o UPLOADED',
      );
    }

    await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.CANCELLED })
      .where(eq(schema.paymentBatches.id, batchId));

    await this.audit.create({
      action: 'CANCELED' as ActionEnumAudit,
      area: 'PRESTAMOS',
      description: 'LOTE DESEMBOLSO CANCELADO',
      recordId: String(batchId),
      tableName: 'payment_batches',
      userId: Number(userId),
    });

    return { message: 'Lote cancelado exitosamente' };
  }

  // ─────────────────────────────────────────────────────────────
  // LISTADO DE LOTES DE DESEMBOLSO
  // ─────────────────────────────────────────────────────────────

  async findAllDisbursementBatches() {
    const rows = await this.db
      .select({
        id: paymentBatches.id,
        paymentBatchReference: paymentBatches.paymentBatchReference,
        description: paymentBatches.description,
        status: paymentBatches.status,
        recordCount: paymentBatches.recordCount,
        totalAmount: paymentBatches.totalAmount,
        currencyCode: paymentBatches.currencyCode,
        bankId: paymentBatches.bankId,
        processedAt: paymentBatches.processedAt,
        createdAt: paymentBatches.createdAt,
      })
      .from(paymentBatches)
      .where(sql`${paymentBatches.batchType} = ${BATCH_TYPE_LOAN_DISBURSEMENT}`);

    return rows;
  }

  async findOneDisbursementBatch(batchId: number) {
    const [batch] = await this.db
      .select()
      .from(paymentBatches)
      .where(eq(paymentBatches.id, batchId));

    if (!batch) throw new NotFoundException(`Lote ${batchId} no encontrado`);

    const items = await this.db
      .select()
      .from(paymentBatchItems)
      .where(eq(paymentBatchItems.paymentBatchId, batchId));

    return { ...batch, items };
  }

  // ─────────────────────────────────────────────────────────────
  // GENERAR ARCHIVO TXT BANCARIO
  // ─────────────────────────────────────────────────────────────

  /**
   * Genera el archivo TXT con formato bancario para el lote de desembolso.
   * El lote debe estar en estado UPLOADED.
   * Formato idéntico al de payment-batches:
   *   HEADER  (57 posiciones): 10 | código_afiliado | cuenta_debitar | fecha | qty | total
   *   DETAIL  (47 posiciones): 20 | tipo_id | num_id | cuenta_beneficiario | monto
   */
  async generateTxtFile(
    batchId: number,
  ): Promise<{ fileName: string; content: string }> {
    // 1. Obtener lote con datos bancarios
    const batchRows = await this.db
      .select()
      .from(schema.paymentBatches)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.paymentBatches.bankId, schema.bankAccounts.id),
      )
      .where(eq(schema.paymentBatches.id, batchId));

    if (batchRows.length === 0)
      throw new NotFoundException('Lote no encontrado');

    const batch = batchRows[0];

    if (batch.payment_batches.status !== paymentBatchStatus.UPLOADED)
      throw new BadRequestException(
        'El lote debe estar en estado UPLOADED para generar el TXT',
      );

    // 2. Código bancario de la caja (configuración del sistema)
    const codeBank =
      await this.settingsSystemService.findKey('CODIGO_BANCO_CAJA');

    // 3. Ítems del lote
    const items = await this.db.query.paymentBatchItems.findMany({
      where: eq(schema.paymentBatchItems.paymentBatchId, batchId),
    });

    if (!items.length) throw new BadRequestException('El lote no tiene ítems');

    /* ----------  HELPER: rellena con ceros a la izquierda  ---------- */
    const rzf = (n: number | string, len: number) =>
      String(n).padStart(len, '0').slice(-len);

    const now = new Date();
    const fecha = format(now, 'yyyyMMdd'); // AAAAMMDD
    const totalCents = Number(batch.payment_batches.totalAmount) * 100;
    const qty = items.length;

    /* ----------  HEADER (57 posiciones) ---------- */
    let content = '';
    content += '10'; // 01-02  ID registro fijo
    content += codeBank.value; // 03-08  Nro. afiliado
    content += rzf(
      batch.bank_accounts?.accountNumber ?? '',
      20,
    ).slice(0, 20); // 09-28  Cuenta a debitar
    content += fecha; // 29-36  Fecha
    content += rzf(qty, 6); // 37-42  Cantidad registros
    content += rzf(totalCents, 15); // 43-57  Monto total (sin decimales)
    content += '\n';

    /* ----------  DETAIL (47 posiciones por fila) ---------- */
    for (const it of items) {
      const cents = Number(it.amount) * 100;
      const idType = it.beneficiaryId.charAt(0).toUpperCase(); // V / E / P
      const idNum = it.beneficiaryId.substring(1); // sin la letra

      let line = '';
      line += '20'; // 01-02  ID registro fijo
      line += idType; // 03-03  Tipo de identificación
      line += rzf(idNum, 9); // 04-12  Número de identificación
      line += rzf(it.beneficiaryAccountNumber, 20).slice(0, 20); // 13-32  Cuenta beneficiario
      line += rzf(cents, 15); // 33-47  Monto (sin decimales)
      content += line + '\n';
    }

    /* ----------  NOMBRE DEL ARCHIVO ---------- */
    const fileName = `DESEMBOLSO-${format(now, 'yyyyMMdd-HHmmss')}-${batchId}.txt`;

    // Guardar nombre del archivo en el lote
    await this.db
      .update(schema.paymentBatches)
      .set({ bankFileName: fileName })
      .where(eq(schema.paymentBatches.id, batchId));

    return { fileName, content };
  }
}
