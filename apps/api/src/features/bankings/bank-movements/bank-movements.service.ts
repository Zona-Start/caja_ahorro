import * as schema from '@/database';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { AuditLogsService } from '@/features/audit/audit-logs/audit-logs.service';
import { AssociateAccountsMovementsService } from '@/features/savings-banks/associate-accounts-movements/associate-accounts-movements.service';
import {
  ActionEnumAudit,
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CreditStatusEnum,
  CurrencyCodeEnum,
  liquidationsStatusEnum,
  LoanStatusEnum,
  paymentSupplierStatusEnum,
  withdrawalStatusEnum,
} from '@/types/enum';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateAndReconcileDto,
  CreateBankMovementDto,
  QueryBankMovementDto,
  ReconcileBankDto,
} from './dto';
import { GetLinkablesDto } from './dto/get-linkables.dto';
import { ReverseMovementDto } from './dto/reverse-movement.dto';

@Injectable()
export class BankMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly assocMvts: AssociateAccountsMovementsService,
    private readonly audit: AuditLogsService,
  ) {}

  /**
   * findAll
   * Lista movimientos con paginación y filtros por cuenta y rango de fechas.
   * Devuelve total de registros para paginar en el front.
   */
  async findAll(query: QueryBankMovementDto) {
    const {
      page = 1,
      limit = 10,
      bankAccountId,
      startDate,
      endDate,
      sortBy = 'id',
      sortOrder = 'asc',
    } = query;
    const offset = (page - 1) * limit;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.bankTransactions[sortBy as keyof typeof schema.bankTransactions]} asc`
        : sql`${schema.bankTransactions[sortBy as keyof typeof schema.bankTransactions]} desc`;

    let searchConditions: SQL<unknown>[] = [];
    if (bankAccountId) {
      searchConditions.push(
        eq(schema.bankTransactions.bankAccountId, bankAccountId),
      );
    }

    if (startDate) {
      searchConditions.push(
        sql`${schema.bankTransactions.transactionDate} >= ${startDate}`,
      );
    }

    if (endDate) {
      searchConditions.push(
        sql`${schema.bankTransactions.transactionDate} <= ${endDate}`,
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const total = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankTransactions)
      .where(searchCondition);

    const data = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(searchCondition)
      .limit(limit)
      .orderBy(orderBy)
      .offset(offset);

    const totalCount = Number(total[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  /**
   * createAndReconcile
   * **Crea** el movimiento bancario y **lo reconcilia en la misma transacción**.
   * Se usa cuando el usuario ya sabe con qué documento interno va a vincular
   * (flujo "1 clic" desde la modal).
   */
  async createAndReconcile(
    dto: CreateAndReconcileDto,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    return db.transaction(async (tx) => {
      // 1.  Inserta el movimiento
      const movement = await this.create(dto.movement, userId, tx);

      if (dto.links) {
        // 2.  Reconcilia enseguida
        await this.reconcile(movement.id, { links: dto.links }, userId, tx);
      }

      return { movement, message: 'Created and reconciled successfully' };
    });
  }

  /* ----------  CRUD BÁSICO  ---------- */
  /**
   * create
   * Inserta un nuevo movimiento bancario (extracto) sin asiento ni vínculo.
   * Convierte montos a string para precisión decimal y asigna usuario creador.
   * Se puede ejecutar dentro de una transacción externa (tx opcional).
   */
  async create(
    dto: CreateBankMovementDto,
    userId?: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const [row] = await db
      .insert(schema.bankTransactions)
      .values({
        ...dto,
        transactionDate: dto.transactionDate.toISOString(),
        category: dto.category as BankTransactionCategory,
        debitAmount: dto.debitAmount ? String(dto.debitAmount) : null,
        creditAmount: dto.creditAmount ? String(dto.creditAmount) : null,
        createdById: userId ?? dto.createdById,
      })
      .returning();
    return row;
  }

  /**
   * findOne
   * Devuelve un único movimiento bancario por ID.
   * Lanza 404 si no existe.
   */
  async findOne(id: number) {
    const [row] = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(eq(schema.bankTransactions.id, id));

    if (!row) throw new NotFoundException(`Bank movement ${id} not found`);
    return row;
  }

  /* ----------  VINCULACIÓN / CONCILIACIÓN  ---------- */

  /**
   * getLinkablesByCategory
   * Devuelve registros internos que:
   * - coinciden en monto (±2 %) y fecha (±5 días)
   * - están en el status que la regla exige
   * - aún no tienen bank_transaction_id
   * - mismo sentido (entrada/salida) que el movimiento bancario
   * El resultado es una lista corta para que el front elija o pre-seleccione.
   */

  async getLinkablesByCategory(dto: GetLinkablesDto) {
    const { category, q, page = 1, limit = 10, startDate, endDate } = dto;
    const offset = (page - 1) * limit;

    const [rule] = await this.drizzle
      .select()
      .from(schema.bankCategoryRule)
      .where(eq(schema.bankCategoryRule.category, category));

    const emptyMeta = {
      page: Number(page),
      limit: Number(limit),
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    };

    if (!rule) return { data: [], meta: emptyMeta };

    const { internalTable, recordStatus } = rule;

    const queries: Record<string, () => any> = {
      // APORTES / DEPÓSITOS (MEMBER_CONTRIBUTION)
      associateAccountMovements: () =>
        this.drizzle
          .select({
            id: schema.associateAccountMovements.id,
            type: sql`'MEMBER_CONTRIBUTION'`.as('type'),
            amount: schema.associateAccountMovements.amount,
            date: schema.associateAccountMovements.transactionDate,
            concept:
              sql`CONCAT('Aporte Socio ',${schema.associateAccountMovements.associateAccountId})`.as(
                'concept',
              ),
          })
          .from(schema.associateAccountMovements)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.associateAccountMovements.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              inArray(schema.associateAccountMovements.movementType, [
                'SAVING_CONTRIBUTION',
                'EMPLOYER_CONTRIBUTION',
                'VOLUNTARY_SAVINGS',
              ]),
              startDate && endDate
                ? sql`${schema.associateAccountMovements.transactionDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // RETIROS PARCIALES (MEMBER_WITHDRAWAL)
      withdrawalsAssociates: () =>
        this.drizzle
          .select({
            id: schema.withdrawalsAssociates.id,
            type: sql`'MEMBER_WITHDRAWAL'`.as('type'),
            amount: schema.withdrawalsAssociates.requestedAmount,
            date: schema.withdrawalsAssociates.withdrawalDate,
            concept:
              sql`CONCAT('Retiro Socio ',${schema.withdrawalsAssociates.referenceCode})`.as(
                'concept',
              ),
          })
          .from(schema.withdrawalsAssociates)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.withdrawalsAssociates.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(
                schema.withdrawalsAssociates.status,
                recordStatus as withdrawalStatusEnum,
              ),
              startDate && endDate
                ? sql`DATE(${schema.withdrawalsAssociates.withdrawalDate}) BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.withdrawalsAssociates.bankTransactionId} IS NULL`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // LIQUIDACIÓN DE HABERES (PAYROLL_SETTLEMENT)
      liquidationsAssociates: () =>
        this.drizzle
          .select({
            id: schema.liquidationsAssociates.id,
            type: sql`'PAYROLL_SETTLEMENT'`.as('type'),
            amount: schema.liquidationsAssociates.netLiquidationAmount,
            date: schema.liquidationsAssociates.liquidationDate,
            concept:
              sql`CONCAT('Liquidación Socio ',${schema.liquidationsAssociates.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.liquidationsAssociates)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.liquidationsAssociates.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(
                schema.liquidationsAssociates.status,
                recordStatus as liquidationsStatusEnum,
              ),
              startDate && endDate
                ? sql`${schema.liquidationsAssociates.liquidationDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.liquidationsAssociates.payoutTransactionId} IS NULL`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // DESEMBOLSO DE PRÉSTAMO (LOAN_DISBURSEMENT)
      loans: () =>
        this.drizzle
          .select({
            id: schema.loans.id,
            type: sql`'LOAN_DISBURSEMENT'`.as('type'),
            amount: schema.loans.disbursedAmount,
            date: schema.loans.disbursementDate,
            concept:
              sql`CONCAT('Desembolso Préstamo N° ',${schema.loans.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.loans)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.loans.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.loans.status, recordStatus as LoanStatusEnum),
              startDate && endDate
                ? sql`${schema.loans.approvalDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // PAGO DE CUOTA DE PRÉSTAMO (LOAN_PAYMENT)
      loanPayments: () =>
        this.drizzle
          .select({
            id: schema.loanPayments.id,
            type: sql`'LOAN_PAYMENT'`.as('type'),
            amount: schema.loanPayments.amount,
            date: schema.loanPayments.paymentDate,
            concept:
              sql`CONCAT('Pago Cuota Préstamo ',${schema.loanPayments.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.loanPayments)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.loanPayments.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              startDate && endDate
                ? sql`${schema.loanPayments.paymentDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.loanPayments.bankId} IS NOT NULL`, // debe tener banco destino
              sql`NOT EXISTS (SELECT 1 FROM ${schema.bankTransactions} bt WHERE bt.id = ${schema.loanPayments.bankId})`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // DESEMBOLSO DE CRÉDITO (CREDIT_DISBURSEMENT)
      credits: () =>
        this.drizzle
          .select({
            id: schema.credits.id,
            type: sql`'CREDIT_DISBURSEMENT'`.as('type'),
            amount: schema.credits.requestedAmount,
            date: schema.credits.approvalDate,
            concept:
              sql`CONCAT('Desembolso Crédito ',${schema.credits.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.credits)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.credits.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.credits.status, recordStatus as CreditStatusEnum),
              startDate && endDate
                ? sql`${schema.credits.approvalDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // PAGO DE CRÉDITO (CREDIT_PAYMENT)
      creditPayments: () =>
        this.drizzle
          .select({
            id: schema.creditPayments.id,
            type: sql`'CREDIT_PAYMENT'`.as('type'),
            amount: schema.creditPayments.amount,
            date: schema.creditPayments.paymentDate,
            concept:
              sql`CONCAT('Pago Crédito ',${schema.creditPayments.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.creditPayments)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.creditPayments.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              startDate && endDate
                ? sql`${schema.creditPayments.paymentDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.creditPayments.bankId} IS NOT NULL`,
              sql`NOT EXISTS (SELECT 1 FROM ${schema.bankTransactions} bt WHERE bt.id = ${schema.creditPayments.bankId})`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      // PAGO A PROVEEDORES (SUPPLIER_PAYMENT)
      supplierPayments: () =>
        this.drizzle
          .select({
            id: schema.supplierPaymentLines.id,
            type: sql`'SUPPLIER_PAYMENT'`.as('type'),
            amount: schema.supplierPaymentLines.amount,
            date: schema.supplierPayments.bankTransactionDate,
            concept:
              sql`CONCAT('Prov ',${schema.suppliers.code},' - ',${schema.accountsPayable.accountsPayableNumber})`.as(
                'concept',
              ),
          })
          .from(schema.supplierPaymentLines)
          .innerJoin(
            schema.supplierPayments,
            eq(
              schema.supplierPayments.id,
              schema.supplierPaymentLines.supplierPaymentId,
            ),
          )
          .innerJoin(
            schema.suppliers,
            eq(schema.suppliers.id, schema.supplierPayments.supplierId),
          )
          .innerJoin(
            schema.accountsPayable,
            eq(
              schema.accountsPayable.id,
              schema.supplierPaymentLines.accountsPayableId,
            ),
          )
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.supplierPaymentLines.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(
                schema.supplierPayments.status,
                recordStatus as paymentSupplierStatusEnum,
              ),
              startDate && endDate
                ? sql`${schema.supplierPayments.bankTransactionDate} BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.supplierPayments.bankAccountId} IS NOT NULL`,
              sql`NOT EXISTS (SELECT 1 FROM ${schema.bankTransactions} bt WHERE bt.id = ${schema.supplierPayments.bankAccountId})`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),

      //anticipos
      supplierAdvances: () =>
        this.drizzle
          .select({
            id: schema.supplierAdvances.id,
            type: sql`'SUPPLIER_ADVANCE'`.as('type'),
            amount: schema.supplierAdvances.amount,
            date: schema.supplierTransactions.bankTransactionDate,
            concept:
              sql`CONCAT('Anticipo Prov ',${schema.suppliers.code},' - ',${schema.supplierTransactions.transactionNumber})`.as(
                'concept',
              ),
          })
          .from(schema.supplierAdvances)
          .innerJoin(
            schema.supplierTransactions,
            eq(
              schema.supplierAdvances.transactionId,
              schema.supplierTransactions.id,
            ),
          )
          .innerJoin(
            schema.suppliers,
            eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          )
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.supplierAdvances.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.supplierTransactions.transactionType, 'ADVANCE'),
              eq(schema.supplierAdvances.statusPayment, 'PAID'),
              startDate && endDate
                ? sql`DATE(${schema.supplierTransactions.bankTransactionDate}) BETWEEN ${startDate} AND ${endDate}`
                : undefined,
              sql`${schema.supplierTransactions.bankAccountId} IS NOT NULL`,
              sql`NOT EXISTS (SELECT 1 FROM ${schema.bankTransactions} bt WHERE bt.id = ${schema.supplierTransactions.bankAccountId})`,
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          ),
    };

    if (!internalTable) return { data: [], meta: emptyMeta };
    const queryFn = queries[internalTable];
    if (!queryFn) {
      return { data: [], meta: emptyMeta };
    }

    const baseQuery = queryFn();
    const cte = baseQuery.as('linkable_items');

    const filterCondition = q
      ? sql`"concept" ILIKE ${`%${q}%`} OR "amount"::text ILIKE ${`%${q}%`} OR "date"::text ILIKE ${`%${q}%`}`
      : undefined;

    const totalQuery = this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(cte)
      .where(filterCondition);

    const dataQuery = this.drizzle
      .select()
      .from(cte)
      .where(filterCondition)
      .limit(limit)
      .offset(offset);

    const [totalResult] = await totalQuery;
    const data = await dataQuery;

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  /**
   * reconcile
   * Vincula un movimiento bancario con 1 o N registros internos **en la misma transacción**:
   * - Crea los links
   * - Cambia status del movimiento a RECONCILED
   * - Cierra los documentos internos (pasa a PAID/CONFIRMED)
   * - Genera el asiento contable de forma automática
   * Si cualquier paso falla **todo se revierte**.
   */
  async reconcile(
    bankTransactionId: number,
    dto: ReconcileBankDto,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    return db.transaction(async (tx) => {
      // 1.  Lock del movimiento
      const [mov] = await tx
        .select()
        .from(schema.bankTransactions)
        .where(eq(schema.bankTransactions.id, bankTransactionId));

      if (!mov) throw new NotFoundException('Bank movement not found');
      if (mov.reconciliationStatus === 'RECONCILED')
        throw new ConflictException('Movement already reconciled');

      // 2.  Links
      await tx.insert(schema.internalTransactionBankLinks).values(
        dto.links.map((l) => ({
          bankTransactionId,
          internalRecordType: l.internalRecordType,
          internalRecordId: l.internalRecordId,
          linkedBy: userId,
        })),
      );

      // 3.  Update movement
      await tx
        .update(schema.bankTransactions)
        .set({
          //reconciliationStatus: 'RECONCILED',
          internalLinkStatus: 'LINKED',
        })
        .where(eq(schema.bankTransactions.id, bankTransactionId));

      // 4.  Cierra documentos y genera asiento
      for (const l of dto.links) {
        // await this.closeInternalDocument(
        //   l.internalRecordType,
        //   l.internalRecordId,
        //   bankTransactionId,
        //   mov.debitAmount ?? '0',
        //   mov.creditAmount ?? '0',
        //   userId,
        //   tx,
        //   mov,
        // );
        //await this.createAccountingEntry(l.internalRecordType, mov, tx); //generar asiento
      }

      return { message: 'Reconciled successfully' };
    });
  }

  /* ----------  PRIVADOS  ---------- */

  /**
   * closeInternalDocument
   * Cambia el status de un documento interno a "pagado / confirmado" y le graba
   * el bankTransactionId para evitar re-vinculaciones.
   * Es usado dentro de la transacción de reconcile().
   */
  private async closeInternalDocument(
    type: string,
    id: number,
    btId: number,
    debitAmount: string,
    creditAmount: string,
    userId: number,
    tx: NodePgDatabase<typeof schema>,
    dataBank?: any,
  ) {
    //procesar retiros
    if (type === 'MEMBER_WITHDRAWAL') {
      const [result] = await tx
        .select()
        .from(schema.withdrawalsAssociates)
        .where(eq(schema.withdrawalsAssociates.id, id));

      // 2. Movimiento interno (crédito a asociado)
      // await this.assocMvts.create(userId, {
      //   associateAccountId: result.associateAccountId as number,
      //   movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
      //   amount: Number(result.requestedAmount),
      //   currencyCode: 'VES' as CurrencyCodeEnum,
      //   transactionDate: new Date(),
      //   description: `Desembolso de retiro - REF: ${result.referenceCode}`,
      //   referenceId: String(btId),
      //   referenceType: dataBank.category,
      //   referenceNumber: dataBank.bankReference ?? undefined,
      //   area: 'Retiros',
      // });

      // if (Number(result?.administrativeFee) !== 0) {
      //   const cal =
      //     (Number(result.requestedAmount) * Number(result.administrativeFee)) /
      //     100;
      //   const expanseAdministration = Number(result.requestedAmount) - cal;

      //   await this.assocMvts.create(userId, {
      //     associateAccountId: result.associateAccountId as number,
      //     movementType: AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
      //     amount: Number(expanseAdministration),
      //     currencyCode: 'VES' as CurrencyCodeEnum,
      //     transactionDate: new Date(),
      //     description: `Gasto Administrativo por Desembolso de retiro - REF: ${result.referenceCode}`,
      //     referenceId: String(btId),
      //     referenceType: dataBank.category,
      //     referenceNumber: dataBank.bankReference ?? undefined,
      //     area: 'Retiros',
      //   });
      // }

      await tx
        .update(schema.withdrawalsAssociates)
        .set({
          bankTransactionId: dataBank.id,
          status: 'DISBURSED',
        })
        .where(eq(schema.withdrawalsAssociates.id, result.id));

      // 5. Auditoría
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'PRESTAMOS',
          description: 'Desembolso de Retiro',
          recordId: String(btId),
          tableName: 'withdrawalsAssociates',
          userId: Number(userId),
        },
        tx,
      );
    }

    //procesar liquidacion
    if (type === 'PAYROLL_SETTLEMENT') {
      const [result] = await tx
        .select()
        .from(schema.liquidationsAssociates)
        .where(eq(schema.liquidationsAssociates.id, id));

      await tx
        .update(schema.liquidationsAssociates)
        .set({
          payoutTransactionId: dataBank.id,
          status: 'DISBURSED',
        })
        .where(eq(schema.liquidationsAssociates.id, result.id));

      // 5. Auditoría
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'LIQUIDACION',
          description: 'Desembolso de Liquidacion',
          recordId: String(btId),
          tableName: 'liquidationsAssociates',
          userId: Number(userId),
        },
        tx,
      );
    }

    //desembolso de prestamos
    if (type === 'LOAN_DISBURSEMENT') {
      const [result] = await tx
        .select()
        .from(schema.loans)
        .where(eq(schema.loans.id, id));

      const [loanType] = await tx
        .select()
        .from(schema.loanTypes)
        .where(eq(schema.loanTypes.id, result.loanTypeId));

      // 2. Movimiento interno (crédito a asociado)
      await this.assocMvts.create(userId, {
        associateAccountId: result.associateId as number,
        movementType: AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT,
        amount: Number(result.disbursedAmount),
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: new Date(),
        description: `Desembolso de prestamo - N°: ${result.customReference}`,
        referenceId: String(btId),
        referenceType: dataBank.category,
        area: 'PRESTAMOS',
      });

      await tx
        .update(schema.loans)
        .set({
          disbursedByUserId: userId,
          status: 'DISBURSED',
          updatedById: userId,
          disbursementDate: new Date().toISOString(),
        })
        .where(eq(schema.loans.id, result.id));

      // 5. Auditoría
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'PRESTAMOS',
          description: 'Desembolso de Prestamo',
          recordId: String(btId),
          tableName: 'loans',
          userId: Number(userId),
        },
        tx,
      );

      if (Number(loanType.administrativeExpensePercentage) > 0) {
        const expanseAdministration =
          Number(result.approvedAmount) - Number(result.disbursedAmount);

        await this.assocMvts.create(userId, {
          associateAccountId: result.associateId as number,
          movementType: AssociateMovementTypeEnum.LOAN_ADMIN_FEE_DEBIT,
          amount: Number(expanseAdministration),
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: new Date(),
          description: `Comision Administrativa por Desembolso de prestamo - N°: ${result.customReference}`,
          referenceId: String(btId),
          referenceType: dataBank.category,
          area: 'PRESTAMOS',
        });

        await this.audit.create(
          {
            action: 'UPDATE' as ActionEnumAudit,
            area: 'PRESTAMOS',
            description: 'Comision Administrativa por Desembolso de Prestamo',
            recordId: String(btId),
            tableName: 'loans',
            userId: Number(userId),
          },
          tx,
        );
      }
    }

    const map: Record<string, () => any> = {
      LOAN_PAYMENT: () =>
        tx
          .update(schema.loanPayments)
          .set({ status: 'DONE' })
          .where(eq(schema.loanPayments.id, id)),
      SUPPLIER_PAYMENT: () =>
        tx
          .update(schema.supplierPayments)
          .set({ status: 'PROCESSED', processedAt: new Date().toISOString() })
          .where(eq(schema.supplierPayments.id, id)),

      CREDIT_DISBURSEMENT: () =>
        tx
          .update(schema.credits)
          .set({
            status: 'PAID',
          })
          .where(eq(schema.credits.id, id)),
    };

    if (map[type]) await map[type]();
  }

  /**
   * createAccountingEntry
   * Genera el asiento contable (doble partida) a partir de la regla de categoría.
   * Se ejecuta dentro de la transacción de reconcile().
   */
  // private async createAccountingEntry(
  //   type: string,
  //   mov: typeof schema.bankTransactions.$inferSelect,
  //   tx: NodePgDatabase<typeof schema>,
  // ) {
  //   const [rule] = await tx
  //     .select()
  //     .from(schema.bankCategoryRule)
  //     .where(eq(schema.bankCategoryRule.category, mov.category!));

  //   if (!rule || !rule.defaultDebitAccountId || !rule.defaultCreditAccountId)
  //     return;

  //   const [entry] = await tx
  //     .insert(schema.accountingEntries)
  //     .values({
  //       companyId: mov.companyId,
  //       entryDate: mov.transactionDate,
  //       concept: `Auto ${mov.category} #${mov.id}`,
  //       totalDebit: mov.debitAmount,
  //       totalCredit: mov.creditAmount,
  //       status: 'POSTED',
  //     })
  //     .returning();

  //   await tx.insert(schema.accountingEntryItems).values([
  //     {
  //       entryId: entry.id,
  //       row: 1,
  //       chartAccountId: rule.defaultDebitAccountId,
  //       debit: mov.debitAmount,
  //       credit: '0',
  //     },
  //     {
  //       entryId: entry.id,
  //       row: 2,
  //       chartAccountId: rule.defaultCreditAccountId,
  //       debit: '0',
  //       credit: mov.creditAmount,
  //     },
  //   ]);
  // }

  /* ----------  UTILIDADES  ---------- */

  /**
   * findInternalLink
   * Devuelve el vínculo que tiene un movimiento bancario (si existe).
   * Se usa para validar desvinculaciones o para mostrar detalle.
   */
  async findInternalLink(bankTransactionId: number) {
    const [link] = await this.drizzle
      .select()
      .from(schema.internalTransactionBankLinks)
      .where(
        eq(
          schema.internalTransactionBankLinks.bankTransactionId,
          bankTransactionId,
        ),
      );

    if (!link)
      throw new NotFoundException(
        `No link found for bank transaction ${bankTransactionId}`,
      );
    return link;
  }

  /**
   * unlinkFromInternalRecord
   * Elimina el vínculo y **reversa** el estado del movimiento y del documento interno.
   * Se usa cuando el usuario des-concilia un movimiento ya cerrado.
   */
  async unlinkFromInternalRecord(
    bankTransactionId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const [link] = await db
      .delete(schema.internalTransactionBankLinks)
      .where(
        eq(
          schema.internalTransactionBankLinks.bankTransactionId,
          bankTransactionId,
        ),
      )
      .returning();

    if (!link)
      throw new NotFoundException(
        `No link found for bank transaction ${bankTransactionId}`,
      );

    await db
      .update(schema.bankTransactions)
      .set({ reconciliationStatus: 'PENDING', internalLinkStatus: 'UNLINKED' })
      .where(eq(schema.bankTransactions.id, bankTransactionId));

    return { message: 'Unlinked successfully' };
  }

  /**
   * reverse
   * Crea una línea opuesta en el extracto, desvincula el movimiento original
   * y genera el asiento de reversión.
   * Todo ocurre en una transacción.
   */
  async reverse(
    bankTransactionId: number,
    dto: ReverseMovementDto,
    userId: number,
  ) {
    return this.drizzle.transaction(async (tx) => {
      // 1.  Lee el movimiento original
      const [orig] = await tx
        .select()
        .from(schema.bankTransactions)
        .where(eq(schema.bankTransactions.id, bankTransactionId))
        .for('update');

      if (!orig) throw new NotFoundException('Bank movement not found');
      if (orig.reconciliationStatus !== 'RECONCILED')
        throw new ConflictException(
          'Only reconciled movements can be reversed',
        );

      // 2.  Crea la línea opuesta (nota de crédito o débito)
      const [rev] = await tx
        .insert(schema.bankTransactions)
        .values({
          bankAccountId: Number(orig.bankAccountId),
          transactionDate: dto.valueDate,
          valueDate: dto.valueDate,
          description: `Reversa de ${orig.description}`,
          category: orig.category as BankTransactionCategory, // misma categoría contable
          bankReference: `${orig.bankReference}-R`, // misma ref + sufijo
          debitAmount: orig.creditAmount, // invierte signo
          creditAmount: orig.debitAmount,
          note: dto.reason ?? 'Reversión usuario',
          createdById: userId,
          paymentMethod: orig.paymentMethod,
        })
        .returning();

      // 3.  Desvincula el original (reabre documento interno)
      await this.unlinkFromInternalRecord(bankTransactionId, tx);

      // 4.  Genera asiento de reversión
      //await this.createReversalEntry(orig, rev, tx);

      return {
        originalId: bankTransactionId,
        reversalId: rev.id,
        message: 'Movement reversed successfully',
      };
    });
  }

  /**
   * createReversalEntry
   * Genera el asiento contable que **revierte** el original:
   * - Si el original fue un débito → reversa creditando la misma cuenta.
   * - Si fue un crédito → reversa debitando la misma cuenta.
   */
  private async createReversalEntry(
    orig: typeof schema.bankTransactions.$inferSelect,
    rev: typeof schema.bankTransactions.$inferSelect,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const [rule] = await tx
      .select()
      .from(schema.bankCategoryRule)
      .where(eq(schema.bankCategoryRule.category, orig.category!));

    if (!rule || !rule.defaultDebitAccountId || !rule.defaultCreditAccountId)
      return;

    const [entry] = await tx
      .insert(schema.accountingEntries)
      .values({
        companyId: 1,
        accountingCycleId: 1,
        entryDate: rev.transactionDate,
        description: `Reversal of ${orig.category as BankTransactionCategory} #${orig.id}`,
        originReferenceId: String(orig.id),
        originType: 'BANK_TRANSACTION',
        status: 'POSTED',
        postedAt: new Date(),
        currencyCode: 'VES',
      })
      .returning();

    await tx.insert(schema.accountingEntryDetails).values([
      {
        accountingEntryId: Number(entry.id),
        accountPlanId: rule.defaultDebitAccountId,
        debit: rev.debitAmount?.toString(),
        credit: '0',
      },
      {
        accountingEntryId: entry.id,
        accountPlanId: rule.defaultCreditAccountId,
        debit: '0',
        credit: rev.creditAmount?.toString(),
      },
    ]);
  }
}
