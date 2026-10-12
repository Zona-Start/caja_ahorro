import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

const haberesTypes = [
  'SAVING_CONTRIBUTION',
  'EMPLOYER_CONTRIBUTION',
  'VOLUNTARY_SAVINGS',
  'DIVIDEND_CREDIT',
  'SURPLUS_SAVINGS_CONTRIBUTION',
];

const overchargeMovementTypes = [
  'SAVING_WITHDRAWAL_REVERSAL_CREDIT',
  'LOAN_PAYMENT_REVERSAL_CREDIT',
  'CREDIT_PAYMENT_REVERSAL_CREDIT',
] as const;

interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function buildMeta(page: number, limit: number, totalCount: number) {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function computePendingBalance(
  schedule: Array<{
    principalAmount: string;
    interestAmount: string;
    paidAmount: string | null;
    paymentStatus: string;
  }>,
): number {
  return schedule
    .filter((s) => ['PENDING', 'PARTIAL', 'LATE'].includes(s.paymentStatus))
    .reduce((sum, s) => {
      const total =
        parseFloat(s.principalAmount) + parseFloat(s.interestAmount);
      return sum + Math.max(total - parseFloat(s.paidAmount || '0'), 0);
    }, 0);
}

@Injectable()
export class MemberService {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}

  // ── Estado de cuenta ────────────────────────────────────────────────────
  async getStatement(associateId: string, tenantId: string) {
    const result = await this.db
      .select({
        id: schema.associates.id,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        nationality: schema.associates.nationality,
        gender: schema.associates.gender,
        admissionDate: schema.associates.dateAdmission,
        graduationDate: schema.associates.dateGraduation,
        status: schema.associates.status,
        isPayrollCredit: schema.associates.isPayrollCredit,
        baseSalary: schema.associates.baseSalary,
        locality: schema.states.name,
        accountNumber: schema.associateAccounts.accountNumber,
        bankName: schema.bankDirectory.name,
        haberesBalance: schema.associateHaberesBalance.haberesBalance,
        haberesContribution: schema.associateHaberesBalance.haberesContribution,
        haberesVoluntary: schema.associateHaberesBalance.haberesVoluntary,
        haberesEmployer: schema.associateHaberesBalance.haberesEmployer,
        surpluses: schema.associateHaberesBalance.surpluses,
      })
      .from(schema.associates)
      .where(
        and(
          eq(schema.associates.id, associateId),
          eq(schema.associates.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.associateAccounts,
        eq(schema.associateAccounts.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.associateHaberesBalance,
        eq(
          schema.associateHaberesBalance.associateAccountId,
          schema.associateAccounts.id,
        ),
      )
      .leftJoin(
        schema.states,
        eq(schema.associates.localityId, schema.states.id),
      )
      .leftJoin(
        schema.bankDirectory,
        eq(schema.associateAccounts.bankDirectoryId, schema.bankDirectory.id),
      );

    if (!result.length) {
      throw new NotFoundException('Asociado no encontrado');
    }

    const a = result[0]!;
    const baseSalaryNum = parseFloat(a.baseSalary || '0');
    const totalHaberesNum = parseFloat(a.haberesBalance || '0');

    return {
      id: a.id,
      cedula: a.cedula,
      fullname: a.fullname,
      nationality: a.nationality,
      gender: a.gender,
      admissionDate: a.admissionDate ?? '',
      graduationDate: a.graduationDate,
      status: a.status,
      isPayrollCredit: a.isPayrollCredit,
      baseSalary: baseSalaryNum.toFixed(2),
      locality: a.locality,
      accountNumber: a.accountNumber,
      bankName: a.bankName,
      totalHaberes: totalHaberesNum.toFixed(2),
      paymentCapacity: (baseSalaryNum * 0.3).toFixed(2),
      disponibility: (totalHaberesNum * 0.8).toFixed(2),
      haberesContribution: Number(a.haberesContribution || 0).toFixed(2),
      haberesVoluntary: Number(a.haberesVoluntary || 0).toFixed(2),
      haberesEmployer: Number(a.haberesEmployer || 0).toFixed(2),
      surpluses: Number(a.surpluses || 0).toFixed(2),
    };
  }

  // ── Haberes (aportes) ───────────────────────────────────────────────────
  async getHaberes(associateId: string, page = 1, limit = 10) {
    const whereClause = and(
      eq(schema.associateAccounts.associateId, associateId),
      eq(schema.associateAccountMovements.status, 'COMPLETED'),
      sql`${schema.associateAccountMovements.movementType} IN (${sql.join(
        haberesTypes.map((t) => sql`${t}`),
        sql`, `,
      )})`,
    );

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause),
      () =>
        this.db
          .select({
            fecha: schema.associateAccountMovements.transactionDate,
            concepto: schema.associateAccountMovements.description,
            tipo: schema.associateAccountMovements.movementType,
            monto: schema.associateAccountMovements.amount,
          })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause)
          .orderBy(desc(schema.associateAccountMovements.transactionDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Retiros ─────────────────────────────────────────────────────────────
  async getRetiros(associateId: string, page = 1, limit = 10) {
    const whereClause = sql`${schema.withdrawalsAssociates.associateAccountId} IN (
      SELECT id FROM ${schema.associateAccounts} WHERE associate_id = ${associateId}
    )`;

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.withdrawalsAssociates)
          .where(whereClause),
      () =>
        this.db
          .select({
            id: schema.withdrawalsAssociates.id,
            withdrawalDate: schema.withdrawalsAssociates.withdrawalDate,
            description: schema.withdrawalTypes.description,
            amount: schema.withdrawalsAssociates.requestedAmount,
            disbursedAmount: schema.withdrawalsAssociates.disbursedAmount,
            administrativeFee: schema.withdrawalsAssociates.administrativeFee,
            paymentMethod: schema.withdrawalsAssociates.paymentMethod,
            status: schema.withdrawalsAssociates.status,
            referenceCode: schema.withdrawalsAssociates.referenceCode,
          })
          .from(schema.withdrawalsAssociates)
          .leftJoin(
            schema.withdrawalTypes,
            eq(
              schema.withdrawalsAssociates.withdrawalTypeId,
              schema.withdrawalTypes.id,
            ),
          )
          .where(whereClause)
          .orderBy(desc(schema.withdrawalsAssociates.withdrawalDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Préstamos ───────────────────────────────────────────────────────────
  async getPrestamos(
    associateId: string,
    tenantId: string,
    page = 1,
    limit = 10,
  ) {
    const whereClause = and(
      eq(schema.loans.associateId, associateId),
      eq(schema.loans.tenantId, tenantId),
    );

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.loans)
          .where(whereClause),
      () =>
        this.db
          .select({
            id: schema.loans.id,
            loanType: schema.loanTypes.name,
            interestRate: schema.loans.interestRate,
            loanAmount: schema.loans.requestedAmount,
            outstandingBalance: sql<number>`COALESCE(
              (SELECT lp.balance_pending FROM ${schema.loanPayments} lp
                WHERE lp.loan_id = ${schema.loans.id} AND lp.payment_status = 'DONE'
                ORDER BY lp.payment_date DESC, lp.created_at DESC LIMIT 1),
              (SELECT SUM(GREATEST(0, las.principal_amount - GREATEST(0, COALESCE(las.paid_amount,0) - las.interest_amount)))
                FROM ${schema.loanAmortizationSchedule} las WHERE las.loan_id = ${schema.loans.id}),
              0
            )`,
            installmentAmount: schema.loans.installmentAmount,
            requestDate: schema.loans.requestDate,
            terms: schema.loans.termUnits,
            status: schema.loans.status,
            customReference: schema.loans.customReference,
            progress: sql<string>`COALESCE(
              (SELECT SUM(las.paid_amount) / NULLIF(SUM(las.total_installment_amount),0)
                FROM ${schema.loanAmortizationSchedule} las WHERE las.loan_id = ${schema.loans.id}), 0)`,
          })
          .from(schema.loans)
          .leftJoin(
            schema.loanTypes,
            eq(schema.loans.loanTypeId, schema.loanTypes.id),
          )
          .where(whereClause)
          .orderBy(desc(schema.loans.requestDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Créditos ────────────────────────────────────────────────────────────
  async getCreditos(
    associateId: string,
    tenantId: string,
    page = 1,
    limit = 10,
  ) {
    const whereClause = and(
      eq(schema.credits.associateId, associateId),
      eq(schema.credits.tenantId, tenantId),
    );

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.credits)
          .where(whereClause),
      () =>
        this.db
          .select({
            id: schema.credits.id,
            creditType: schema.creditsTypes.name,
            interestRate: schema.credits.interestRate,
            creditAmount: schema.credits.requestedAmount,
            outstandingBalance: sql<number>`COALESCE(
              (SELECT cp.balance_pending FROM ${schema.creditPayments} cp
                WHERE cp.credit_id = ${schema.credits.id} AND cp.payment_status = 'DONE'
                ORDER BY cp.payment_date DESC, cp.created_at DESC LIMIT 1),
              (SELECT SUM(GREATEST(0, cas.principal_amount - GREATEST(0, COALESCE(cas.paid_amount,0) - cas.interest_amount)))
                FROM ${schema.creditAmortizationSchedule} cas WHERE cas.credit_id = ${schema.credits.id}),
              0
            )`,
            installmentAmount: schema.credits.installmentAmount,
            requestDate: schema.credits.requestDate,
            terms: schema.credits.termUnits,
            status: schema.credits.status,
            customReference: schema.credits.customReference,
            progress: sql<string>`COALESCE(
              (SELECT SUM(cas.paid_amount) / NULLIF(SUM(cas.total_installment_amount),0)
                FROM ${schema.creditAmortizationSchedule} cas WHERE cas.credit_id = ${schema.credits.id}), 0)`,
          })
          .from(schema.credits)
          .leftJoin(
            schema.creditsTypes,
            eq(schema.credits.creditTypeId, schema.creditsTypes.id),
          )
          .where(whereClause)
          .orderBy(desc(schema.credits.requestDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Historial ───────────────────────────────────────────────────────────
  async getHistorial(associateId: string, page = 1, limit = 10) {
    const whereClause = eq(schema.associateAccounts.associateId, associateId);

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause),
      () =>
        this.db
          .select({
            tipo: schema.associateAccountMovements.movementType,
            monto: schema.associateAccountMovements.amount,
            fecha: schema.associateAccountMovements.transactionDate,
            descripcion: schema.associateAccountMovements.description,
            numeroReferencia: schema.associateAccountMovements.internalCode,
            status: schema.associateAccountMovements.status,
          })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause)
          .orderBy(desc(schema.associateAccountMovements.transactionDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Movimientos por tipo (excesos/reversiones) ──────────────────────────
  async getMovimientosPorTipo(
    associateId: string,
    movementType: string,
    page = 1,
    limit = 10,
  ) {
    const whereClause = and(
      eq(schema.associateAccounts.associateId, associateId),
      sql`${schema.associateAccountMovements.movementType} = ${movementType}`,
    );

    return this.paginate(
      page,
      limit,
      () =>
        this.db
          .select({ total: sql<number>`count(*)` })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause),
      () =>
        this.db
          .select({
            tipo: schema.associateAccountMovements.movementType,
            monto: schema.associateAccountMovements.amount,
            fecha: schema.associateAccountMovements.transactionDate,
            descripcion: schema.associateAccountMovements.description,
            numeroReferencia: schema.associateAccountMovements.internalCode,
            status: schema.associateAccountMovements.status,
          })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .where(whereClause)
          .orderBy(desc(schema.associateAccountMovements.transactionDate))
          .limit(limit)
          .offset((page - 1) * limit),
    );
  }

  // ── Resumen de excesos ──────────────────────────────────────────────────
  async getExcesosResumen(
    associateId: string,
  ): Promise<Record<string, number>> {
    const rows = await this.db
      .select({
        movementType: schema.associateAccountMovements.movementType,
        total: sql<number>`count(*)`,
      })
      .from(schema.associateAccountMovements)
      .innerJoin(
        schema.associateAccounts,
        eq(
          schema.associateAccountMovements.associateAccountId,
          schema.associateAccounts.id,
        ),
      )
      .where(
        and(
          eq(schema.associateAccounts.associateId, associateId),
          sql`${schema.associateAccountMovements.movementType} IN (${sql.join(
            overchargeMovementTypes.map((t) => sql`${t}`),
            sql`, `,
          )})`,
        ),
      )
      .groupBy(schema.associateAccountMovements.movementType);

    const summary: Record<string, number> = {};
    for (const type of overchargeMovementTypes) summary[type] = 0;
    for (const row of rows) summary[row.movementType] = Number(row.total);
    return summary;
  }

  // ── Detalle de préstamo (valida pertenencia) ────────────────────────────
  async getPrestamoDetalle(
    associateId: string,
    tenantId: string,
    loanId: string,
  ) {
    const conditions: SQL<unknown>[] = [
      eq(schema.loans.id, loanId),
      eq(schema.loans.associateId, associateId),
      eq(schema.loans.tenantId, tenantId),
    ];

    const [loan] = await this.db
      .select()
      .from(schema.loans)
      .where(and(...conditions));

    if (!loan) throw new NotFoundException('Préstamo no encontrado');

    const [associate, loanType] = await Promise.all([
      this.db.query.associates.findFirst({
        where: eq(schema.associates.id, associateId),
      }),
      loan.loanTypeId
        ? this.db.query.loanTypes.findFirst({
            where: eq(schema.loanTypes.id, loan.loanTypeId),
          })
        : Promise.resolve(null),
    ]);

    const schedule = await this.db
      .select({
        id: schema.loanAmortizationSchedule.id,
        loanId: schema.loanAmortizationSchedule.loanId,
        installmentNumber: schema.loanAmortizationSchedule.installmentNumber,
        dueDate: schema.loanAmortizationSchedule.dueDate,
        principalAmount: schema.loanAmortizationSchedule.principalAmount,
        interestAmount: schema.loanAmortizationSchedule.interestAmount,
        totalInstallmentAmount:
          schema.loanAmortizationSchedule.totalInstallmentAmount,
        principalBalancePending:
          schema.loanAmortizationSchedule.principalBalancePending,
        paymentStatus: schema.loanAmortizationSchedule.paymentStatus,
        paidAmount: schema.loanAmortizationSchedule.paidAmount,
        lastPaymentDate: schema.loanAmortizationSchedule.lastPaymentDate,
      })
      .from(schema.loanAmortizationSchedule)
      .where(eq(schema.loanAmortizationSchedule.loanId, loanId))
      .orderBy(schema.loanAmortizationSchedule.installmentNumber);

    const paidInstallments = schedule.filter(
      (s) => s.paymentStatus === 'PAID',
    ).length;
    const totalPaid = schedule.reduce(
      (sum, s) => sum + parseFloat(s.paidAmount || '0'),
      0,
    );

    const [lastPayment] = await this.db
      .select({ balancePending: schema.loanPayments.balancePending })
      .from(schema.loanPayments)
      .where(
        and(
          eq(schema.loanPayments.loanId, loanId),
          eq(schema.loanPayments.status, 'DONE'),
        ),
      )
      .orderBy(
        desc(schema.loanPayments.paymentDate),
        desc(schema.loanPayments.createdAt),
      )
      .limit(1);

    const totalPending =
      lastPayment?.balancePending != null
        ? Number(lastPayment.balancePending)
        : computePendingBalance(schedule);

    return {
      loan: {
        ...loan,
        associateName: associate?.fullname ?? null,
        associateCedula: associate?.cedula ?? null,
        loanTypeName: loanType?.name ?? null,
      },
      amortizationSchedule: schedule,
      summary: {
        totalPaid,
        totalPending,
        paidInstallments,
        pendingInstallments: schedule.length - paidInstallments,
      },
    };
  }

  // ── Detalle de crédito (valida pertenencia) ─────────────────────────────
  async getCreditoDetalle(
    associateId: string,
    tenantId: string,
    creditId: string,
  ) {
    const [credit] = await this.db
      .select()
      .from(schema.credits)
      .where(
        and(
          eq(schema.credits.id, creditId),
          eq(schema.credits.associateId, associateId),
          eq(schema.credits.tenantId, tenantId),
        ),
      );

    if (!credit) throw new NotFoundException('Crédito no encontrado');

    const [associate, creditType] = await Promise.all([
      this.db.query.associates.findFirst({
        where: eq(schema.associates.id, associateId),
      }),
      credit.creditTypeId
        ? this.db.query.creditsTypes.findFirst({
            where: eq(schema.creditsTypes.id, credit.creditTypeId),
          })
        : Promise.resolve(null),
    ]);

    const schedule = await this.db
      .select({
        id: schema.creditAmortizationSchedule.id,
        creditId: schema.creditAmortizationSchedule.creditId,
        installmentNumber: schema.creditAmortizationSchedule.installmentNumber,
        dueDate: schema.creditAmortizationSchedule.dueDate,
        principalAmount: schema.creditAmortizationSchedule.principalAmount,
        interestAmount: schema.creditAmortizationSchedule.interestAmount,
        totalInstallmentAmount:
          schema.creditAmortizationSchedule.totalInstallmentAmount,
        principalBalancePending:
          schema.creditAmortizationSchedule.principalBalancePending,
        paymentStatus: schema.creditAmortizationSchedule.paymentStatus,
        paidAmount: schema.creditAmortizationSchedule.paidAmount,
        lastPaymentDate: schema.creditAmortizationSchedule.lastPaymentDate,
      })
      .from(schema.creditAmortizationSchedule)
      .where(eq(schema.creditAmortizationSchedule.creditId, creditId))
      .orderBy(schema.creditAmortizationSchedule.installmentNumber);

    const paidInstallments = schedule.filter(
      (s) => s.paymentStatus === 'PAID',
    ).length;
    const totalPaid = schedule.reduce(
      (sum, s) => sum + parseFloat(s.paidAmount || '0'),
      0,
    );

    const [lastPayment] = await this.db
      .select({ balancePending: schema.creditPayments.balancePending })
      .from(schema.creditPayments)
      .where(
        and(
          eq(schema.creditPayments.creditId, creditId),
          eq(schema.creditPayments.status, 'DONE'),
        ),
      )
      .orderBy(
        desc(schema.creditPayments.paymentDate),
        desc(schema.creditPayments.createdAt),
      )
      .limit(1);

    const totalPending =
      lastPayment?.balancePending != null
        ? Number(lastPayment.balancePending)
        : computePendingBalance(schedule);

    const items = await this.db
      .select({
        id: schema.creditItemSales.id,
        itemType: schema.creditItemSales.itemType,
        itemDescription: schema.creditItemSales.itemDescription,
        productName: schema.products.name,
        quantity: schema.creditItemSales.quantity,
        agreedSellingPrice: schema.creditItemSales.agreedSellingPrice,
        saleDate: schema.creditItemSales.saleDate,
        deliveryStatus: schema.creditItemSales.deliveryStatus,
      })
      .from(schema.creditItemSales)
      .leftJoin(
        schema.products,
        and(
          eq(schema.creditItemSales.itemId, schema.products.id),
          eq(schema.creditItemSales.itemType, 'PRODUCT'),
        ),
      )
      .where(eq(schema.creditItemSales.creditId, creditId));

    return {
      credit: {
        ...credit,
        associateName: associate?.fullname ?? null,
        associateCedula: associate?.cedula ?? null,
        creditTypeName: creditType?.name ?? null,
      },
      amortizationSchedule: schedule,
      items,
      summary: {
        totalPaid,
        totalPending,
        paidInstallments,
        pendingInstallments: schedule.length - paidInstallments,
      },
    };
  }

  // ── Detalle de retiro (valida pertenencia) ──────────────────────────────
  async getRetiroDetalle(
    associateId: string,
    tenantId: string,
    withdrawalId: string,
  ) {
    const [withdrawal] = await this.db
      .select({
        id: schema.withdrawalsAssociates.id,
        associateAccountId: schema.withdrawalsAssociates.associateAccountId,
        withdrawalTypeId: schema.withdrawalsAssociates.withdrawalTypeId,
        withdrawalDate: schema.withdrawalsAssociates.withdrawalDate,
        requestedAmount: schema.withdrawalsAssociates.requestedAmount,
        administrativeFee: schema.withdrawalsAssociates.administrativeFee,
        disbursedAmount: schema.withdrawalsAssociates.disbursedAmount,
        paymentMethod: schema.withdrawalsAssociates.paymentMethod,
        referenceCode: schema.withdrawalsAssociates.referenceCode,
        status: schema.withdrawalsAssociates.status,
        withdrawalItems: schema.withdrawalsAssociates.withdrawalItems,
        commercialHouseId: schema.withdrawalsAssociates.commercialHouseId,
        associateName: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        withdrawalTypeName: schema.withdrawalTypes.description,
        isHouseComercial: schema.withdrawalTypes.isHouseComercial,
        isInternalInventory: schema.withdrawalTypes.isInternalInventory,
      })
      .from(schema.withdrawalsAssociates)
      .innerJoin(
        schema.associateAccounts,
        eq(
          schema.withdrawalsAssociates.associateAccountId,
          schema.associateAccounts.id,
        ),
      )
      .innerJoin(
        schema.associates,
        eq(schema.associateAccounts.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.withdrawalTypes,
        eq(
          schema.withdrawalsAssociates.withdrawalTypeId,
          schema.withdrawalTypes.id,
        ),
      )
      .where(
        and(
          eq(schema.withdrawalsAssociates.id, withdrawalId),
          eq(schema.withdrawalsAssociates.tenantId, tenantId),
          eq(schema.associateAccounts.associateId, associateId),
        ),
      );

    if (!withdrawal) throw new NotFoundException('Retiro no encontrado');

    return {
      withdrawal: {
        ...withdrawal,
        withdrawalDate: withdrawal.withdrawalDate?.toISOString() || null,
      },
      items: withdrawal.withdrawalItems
        ? Array.isArray(withdrawal.withdrawalItems)
          ? withdrawal.withdrawalItems
          : JSON.parse(String(withdrawal.withdrawalItems))
        : [],
    };
  }

  // ── Helper de paginación ────────────────────────────────────────────────
  private async paginate<T>(
    page: number,
    limit: number,
    countFn: () => Promise<{ total: number }[]>,
    dataFn: () => Promise<T[]>,
  ): Promise<PaginatedResult<T>> {
    const [countRows, data] = await Promise.all([countFn(), dataFn()]);
    const totalCount = Number(countRows[0]?.total || 0);
    return {
      data: data.map((d) => {
        const row = d as Record<string, unknown>;
        if (row.fecha instanceof Date) row.fecha = row.fecha.toISOString();
        if (row.withdrawalDate instanceof Date) {
          row.withdrawalDate = row.withdrawalDate.toISOString();
        }
        return d;
      }),
      meta: buildMeta(page, limit, totalCount),
    };
  }
}
