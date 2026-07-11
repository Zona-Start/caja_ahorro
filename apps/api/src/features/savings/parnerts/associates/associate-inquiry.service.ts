import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';

const haberesTypes = [
  'SAVING_CONTRIBUTION',
  'EMPLOYER_CONTRIBUTION',
  'VOLUNTARY_SAVINGS',
  'DIVIDEND_CREDIT',
];

export interface PaginatedResult<T> {
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

export interface AssociateStatement {
  id: string;
  cedula: string;
  fullname: string;
  nationality: string;
  gender: string | null;
  admissionDate: string;
  graduationDate: string | null;
  status: string;
  isPayrollCredit: boolean;
  baseSalary: string | null;
  locality: string | null;
  accountNumber: string | null;
  bankName: string | null;
  totalHaberes: string;
  paymentCapacity: string;
  disponibility: string;
  haberesContribution: string;
  haberesVoluntary: string;
  haberesEmployer: string;
  surpluses: string;
}

@Injectable()
export class AssociateInquiryService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getStatement(
    tenantId: string,
    cedula: string,
  ): Promise<AssociateStatement> {
    const conditions: SQL<unknown>[] = [eq(schema.associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(schema.associates.tenantId, tenantId));
    }

    const result = await this.drizzle
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
      .where(and(...conditions))
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
      throw new NotFoundException(
        `Asociado con cédula ${cedula} no encontrado`,
      );
    }

    const a = result[0];
    const baseSalaryNum = parseFloat(a.baseSalary || '0');
    const totalHaberesNum = parseFloat(a.haberesBalance || '0');

    return {
      ...a,
      baseSalary: baseSalaryNum.toFixed(2),
      totalHaberes: totalHaberesNum.toFixed(2),
      paymentCapacity: (baseSalaryNum * 0.3).toFixed(2),
      disponibility: (totalHaberesNum * 0.8).toFixed(2),
      haberesContribution: Number(a.haberesContribution || 0).toFixed(2),
      haberesVoluntary: Number(a.haberesVoluntary || 0).toFixed(2),
      haberesEmployer: Number(a.haberesEmployer || 0).toFixed(2),
      surpluses: Number(a.surpluses || 0).toFixed(2),
    };
  }

  async getHaberes(
    tenantId: string,
    associateId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const conditions: SQL<unknown>[] = [
      eq(schema.associateAccounts.associateId, associateId),
      eq(schema.associateAccountMovements.status, 'COMPLETED'),
    ];

    if (tenantId) {
      conditions.push(
        sql`${schema.associateAccounts.associateId} IN (
          SELECT id FROM ${schema.associates} WHERE tenant_id = ${tenantId}
        )`,
      );
    }

    const whereClause = and(
      ...conditions,
      sql`${schema.associateAccountMovements.movementType} IN (${sql.join(
        haberesTypes.map((t) => sql`${t}`),
        sql`, `,
      )})`,
    );

    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      this.drizzle
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
      this.drizzle
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
        .offset(offset),
    ]);

    const totalCount = Number(totalResult[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map((d) => ({
        ...d,
        fecha: d.fecha?.toISOString() || null,
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getRetiros(
    tenantId: string,
    associateId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(schema.withdrawalsAssociates.tenantId, tenantId));
    }

    conditions.push(
      sql`${schema.withdrawalsAssociates.associateAccountId} IN (
        SELECT id FROM ${schema.associateAccounts} WHERE associate_id = ${associateId}
      )`,
    );

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      this.drizzle
        .select({ total: sql<number>`count(*)` })
        .from(schema.withdrawalsAssociates)
        .where(whereClause),
      this.drizzle
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
        .offset(offset),
    ]);

    const totalCount = Number(totalResult[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map((d) => ({
        ...d,
        withdrawalDate: d.withdrawalDate?.toISOString() || null,
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getPrestamos(
    tenantId: string,
    associateId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const conditions: SQL<unknown>[] = [
      eq(schema.loans.associateId, associateId),
    ];
    if (tenantId) {
      conditions.push(eq(schema.loans.tenantId, tenantId));
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      this.drizzle
        .select({ total: sql<number>`count(*)` })
        .from(schema.loans)
        .where(whereClause),
      this.drizzle
        .select({
          id: schema.loans.id,
          loanType: schema.loanTypes.name,
          interestRate: schema.loans.interestRate,
          loanAmount: schema.loans.requestedAmount,
          outstandingBalance:
            schema.loanOutstandingBalance.outstandingTotalBalance,
          installmentAmount: schema.loans.installmentAmount,
          requestDate: schema.loans.requestDate,
          terms: schema.loans.termUnits,
          status: schema.loans.status,
          customReference: schema.loans.customReference,
          progress: sql<string>`COALESCE(
            (SELECT COUNT(*) FILTER (WHERE las.payment_status = 'PAID') * 1.0 / NULLIF(COUNT(*), 0)
             FROM ${schema.loanAmortizationSchedule} las WHERE las.loan_id = ${schema.loans.id}
            ), '0')`,
        })
        .from(schema.loans)
        .leftJoin(
          schema.loanTypes,
          eq(schema.loans.loanTypeId, schema.loanTypes.id),
        )
        .leftJoin(
          schema.loanOutstandingBalance,
          eq(schema.loanOutstandingBalance.loanId, schema.loans.id),
        )
        .where(whereClause)
        .orderBy(desc(schema.loans.requestDate))
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalResult[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map((d) => ({
        ...d,
        requestDate: d.requestDate || null,
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getCreditos(
    tenantId: string,
    associateId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const conditions: SQL<unknown>[] = [
      eq(schema.credits.associateId, associateId),
    ];
    if (tenantId) {
      conditions.push(eq(schema.credits.tenantId, tenantId));
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      this.drizzle
        .select({ total: sql<number>`count(*)` })
        .from(schema.credits)
        .where(whereClause),
      this.drizzle
        .select({
          id: schema.credits.id,
          creditType: schema.creditsTypes.name,
          interestRate: schema.credits.interestRate,
          creditAmount: schema.credits.requestedAmount,
          outstandingBalance:
            schema.creditOutstandingBalance.outstandingTotalBalance,
          installmentAmount: schema.credits.installmentAmount,
          requestDate: schema.credits.requestDate,
          terms: schema.credits.termUnits,
          status: schema.credits.status,
          customReference: schema.credits.customReference,
          progress: sql<string>`COALESCE(
            (SELECT COUNT(*) FILTER (WHERE cas.payment_status = 'PAID') * 1.0 / NULLIF(COUNT(*), 0)
             FROM ${schema.creditAmortizationSchedule} cas WHERE cas.credit_id = ${schema.credits.id}
            ), '0')`,
        })
        .from(schema.credits)
        .leftJoin(
          schema.creditsTypes,
          eq(schema.credits.creditTypeId, schema.creditsTypes.id),
        )
        .leftJoin(
          schema.creditOutstandingBalance,
          eq(schema.creditOutstandingBalance.creditId, schema.credits.id),
        )
        .where(whereClause)
        .orderBy(desc(schema.credits.requestDate))
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalResult[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map((d) => ({
        ...d,
        requestDate: d.requestDate || null,
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getHistorial(
    tenantId: string,
    associateId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const conditions: SQL<unknown>[] = [
      eq(schema.associateAccounts.associateId, associateId),
    ];

    if (tenantId) {
      conditions.push(
        sql`${schema.associateAccounts.associateId} IN (
          SELECT id FROM ${schema.associates} WHERE tenant_id = ${tenantId}
        )`,
      );
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      this.drizzle
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
      this.drizzle
        .select({
          tipo: schema.associateAccountMovements.movementType,
          monto: schema.associateAccountMovements.amount,
          fecha: schema.associateAccountMovements.transactionDate,
          descripcion: schema.associateAccountMovements.description,
          numeroReferencia: schema.associateAccountMovements.referenceNumber,
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
        .offset(offset),
    ]);

    const totalCount = Number(totalResult[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map((d) => ({
        ...d,
        fecha: d.fecha?.toISOString() || null,
      })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getPrestamoDetalle(
    tenantId: string,
    loanId: string,
  ): Promise<Record<string, unknown>> {
    const conditions: SQL<unknown>[] = [eq(schema.loans.id, loanId)];
    if (tenantId) {
      conditions.push(eq(schema.loans.tenantId, tenantId));
    }

    const [loanResult] = await this.drizzle
      .select({
        id: schema.loans.id,
        associateId: schema.loans.associateId,
        loanTypeId: schema.loans.loanTypeId,
        requestDate: schema.loans.requestDate,
        approvalDate: schema.loans.approvalDate,
        disbursementDate: schema.loans.disbursementDate,
        requestedAmount: schema.loans.requestedAmount,
        approvedAmount: schema.loans.approvedAmount,
        disbursedAmount: schema.loans.disbursedAmount,
        startDate: schema.loans.startDate,
        endDate: schema.loans.endDate,
        interestRate: schema.loans.interestRate,
        termType: schema.loans.termType,
        termUnits: schema.loans.termUnits,
        totalInterest: schema.loans.totalInterest,
        installmentAmount: schema.loans.installmentAmount,
        totalPayable: schema.loans.totalPayable,
        expensesAmount: schema.loans.expensesAmount,
        overdraftAmount: schema.loans.overdraftAmount,
        previousLoanId: schema.loans.previousLoanId,
        paymentMethod: schema.loans.paymentMethod,
        disbursementAccountId: schema.loans.disbursementAccountId,
        status: schema.loans.status,
        rejectionReason: schema.loans.rejectionReason,
        notes: schema.loans.notes,
        customReference: schema.loans.customReference,
        currencyCode: schema.loans.currencyCode,
        balanceInFavor: schema.loans.balanceInFavor,
        associateName: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        loanTypeName: schema.loanTypes.name,
      })
      .from(schema.loans)
      .innerJoin(
        schema.associates,
        eq(schema.loans.associateId, schema.associates.id),
      )
      .innerJoin(
        schema.loanTypes,
        eq(schema.loans.loanTypeId, schema.loanTypes.id),
      )
      .where(and(...conditions));

    if (!loanResult) {
      throw new NotFoundException(`Préstamo ${loanId} no encontrado`);
    }

    const schedule = await this.drizzle
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
    const totalPending = schedule
      .filter((s) => s.paymentStatus !== 'PAID')
      .reduce((sum, s) => sum + parseFloat(s.totalInstallmentAmount || '0'), 0);

    return {
      loan: loanResult,
      amortizationSchedule: schedule,
      summary: {
        totalPaid,
        totalPending,
        paidInstallments,
        pendingInstallments: schedule.length - paidInstallments,
      },
    };
  }

  async getCreditoDetalle(
    tenantId: string,
    creditId: string,
  ): Promise<Record<string, unknown>> {
    const conditions: SQL<unknown>[] = [eq(schema.credits.id, creditId)];
    if (tenantId) {
      conditions.push(eq(schema.credits.tenantId, tenantId));
    }

    const [creditResult] = await this.drizzle
      .select({
        id: schema.credits.id,
        associateId: schema.credits.associateId,
        creditTypeId: schema.credits.creditTypeId,
        requestDate: schema.credits.requestDate,
        approvalDate: schema.credits.approvalDate,
        requestedAmount: schema.credits.requestedAmount,
        haberesPayment: schema.credits.haberesPayment,
        directPayment: schema.credits.directPayment,
        directPaymentMethod: schema.credits.directPaymentMethod,
        directPaymentReference: schema.credits.directPaymentReference,
        startDate: schema.credits.startDate,
        endDate: schema.credits.endDate,
        interestRate: schema.credits.interestRate,
        termType: schema.credits.termType,
        termUnits: schema.credits.termUnits,
        totalInterest: schema.credits.totalInterest,
        installmentAmount: schema.credits.installmentAmount,
        totalPayable: schema.credits.totalPayable,
        expensesAmount: schema.credits.expensesAmount,
        overdraftAmount: schema.credits.overdraftAmount,
        previousCreditId: schema.credits.previousCreditId,
        status: schema.credits.status,
        rejectionReason: schema.credits.rejectionReason,
        notes: schema.credits.notes,
        customReference: schema.credits.customReference,
        currencyCode: schema.credits.currencyCode,
        balanceInFavor: schema.credits.balanceInFavor,
        associateName: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        creditTypeName: schema.creditsTypes.name,
      })
      .from(schema.credits)
      .innerJoin(
        schema.associates,
        eq(schema.credits.associateId, schema.associates.id),
      )
      .innerJoin(
        schema.creditsTypes,
        eq(schema.credits.creditTypeId, schema.creditsTypes.id),
      )
      .where(and(...conditions));

    if (!creditResult) {
      throw new NotFoundException(`Crédito ${creditId} no encontrado`);
    }

    const schedule = await this.drizzle
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
    const totalPending = schedule
      .filter((s) => s.paymentStatus !== 'PAID')
      .reduce((sum, s) => sum + parseFloat(s.totalInstallmentAmount || '0'), 0);

    const items = await this.drizzle
      .select({
        id: schema.creditItemSales.id,
        itemType: schema.creditItemSales.itemType,
        itemId: schema.creditItemSales.itemId,
        itemDescription: schema.creditItemSales.itemDescription,
        quantity: schema.creditItemSales.quantity,
        agreedSellingPrice: schema.creditItemSales.agreedSellingPrice,
        saleDate: schema.creditItemSales.saleDate,
        deliveryStatus: schema.creditItemSales.deliveryStatus,
        days: schema.creditItemSales.days,
        productName: schema.products.name,
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
      credit: creditResult,
      amortizationSchedule: schedule,
      items: items.map((i) => ({
        id: i.id,
        itemType: i.itemType,
        itemDescription: i.itemDescription,
        productName: i.productName,
        quantity: i.quantity,
        agreedSellingPrice: i.agreedSellingPrice,
        saleDate: i.saleDate || null,
        deliveryStatus: i.deliveryStatus,
      })),
      summary: {
        totalPaid,
        totalPending,
        paidInstallments,
        pendingInstallments: schedule.length - paidInstallments,
      },
    };
  }

  async getRetiroDetalle(
    tenantId: string,
    withdrawalId: string,
  ): Promise<Record<string, unknown>> {
    const conditions: SQL<unknown>[] = [
      eq(schema.withdrawalsAssociates.id, withdrawalId),
    ];
    if (tenantId) {
      conditions.push(eq(schema.withdrawalsAssociates.tenantId, tenantId));
    }

    const [withdrawal] = await this.drizzle
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
      .where(and(...conditions));

    if (!withdrawal) {
      throw new NotFoundException(`Retiro ${withdrawalId} no encontrado`);
    }

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
}
