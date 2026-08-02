import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountBalances,
  accountingCycles,
  accountingEntries,
  accountsPayable,
  associateAccounts,
  associates,
  auditEvents,
  bankAccounts,
  bankTransactions,
  contributionBatches,
  credits,
  fixedAssets,
  inventoryMovementItems,
  inventoryMovements,
  liquidationsAssociates,
  loginAttempts,
  loans,
  products,
  services,
  supplierInvoices,
  suppliers,
  tenants,
  users,
  withdrawalsAssociates,
} from '@/database/schema/tables';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lte, sql, sum } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DashboardStats } from './dto/stats-response.dto';

const SAVINGS_BUSINESS_TYPE = 'CAJA_AHORRO';

const ACTIVE_LOAN_STATUSES: (typeof loans.$inferSelect)['status'][] = ['APPROVED', 'DISBURSED', 'IN_PAYMENT'];
const PENDING_LOAN_STATUSES: (typeof loans.$inferSelect)['status'][] = [
  'REQUESTED',
  'APPROVED',
  'PENDING_DISBURSEMENT_BANK_BATCH',
];
const PAID_LOAN_STATUSES: (typeof loans.$inferSelect)['status'][] = ['PAID'];

const ACTIVE_CREDIT_STATUSES: (typeof credits.$inferSelect)['status'][] = ['APPROVED', 'IN_PAYMENT'];
const PENDING_CREDIT_STATUSES: (typeof credits.$inferSelect)['status'][] = ['REQUESTED'];
const PAID_CREDIT_STATUSES: (typeof credits.$inferSelect)['status'][] = ['PAID'];

@Injectable()
export class StatsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
  ) { }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [tenant] = await this.db
      .select({ businessType: tenants.businessType })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    const businessType = tenant?.businessType ?? 'EMPRESA_COMERCIAL';
    const isSavings = businessType === SAVINGS_BUSINESS_TYPE;

    const [
      kpis,
      pendingRequests,
      finance,
      alerts,
      audit,
      savings,
      contributions,
      inventory,
      purchasing,
      banking,
    ] = await Promise.all([
      this.getKpis(tenantId, isSavings),
      this.getPendingRequests(tenantId, isSavings),
      this.getFinanceStats(tenantId),
      this.getAlerts(tenantId),
      this.getAuditStats(tenantId),
      isSavings ? this.getSavingsStats(tenantId) : null,
      this.getContributionsStats(tenantId),
      this.getInventoryStats(tenantId),
      this.getPurchasingStats(tenantId),
      this.getBankingStats(tenantId),
    ]);

    return {
      businessType,
      kpis,
      pendingRequests,
      finance,
      alerts,
      audit,
      savings,
      contributions,
      inventory,
      purchasing,
      banking,
    };
  }

  private async getKpis(tenantId: string, isSavings: boolean) {
    const [associatesActive, savingsBalance, portfolio, payable] =
      await Promise.all([
        isSavings
          ? this.db
            .select({ count: count() })
            .from(associates)
            .where(
              and(
                eq(associates.tenantId, tenantId),
                eq(associates.status, 'ACTIVE'),
              ),
            )
          : Promise.resolve([{ count: 0 }]),
        isSavings
          ? this.db
            .select({ total: sum(schema.associateAccountBalances.calculatedBalance) })
            .from(schema.associateAccountBalances)
            .where(and(eq(schema.associateAccountBalances.tenantId, tenantId), eq(schema.associateAccountBalances.status, 'ACTIVE')))
          : Promise.resolve([{ total: 0 }]),
        isSavings
          ? this.getActivePortfolioAmount(tenantId)
          : Promise.resolve(0),
        this.db
          .select({
            pending: sum(accountsPayable.remainingAmount),
          })
          .from(accountsPayable)
          .where(
            and(
              eq(accountsPayable.tenantId, tenantId),
              eq(accountsPayable.status, 'PENDING'),
            ),
          ),
      ]);

    return {
      totalActiveAssociates: Number(associatesActive[0]?.count ?? 0),
      totalSavingsBalance: Number(savingsBalance[0]?.total ?? 0),
      activePortfolioAmount: Number(portfolio),
      pendingAccountsPayableAmount: Number(payable[0]?.pending ?? 0),
    };
  }

  private async getActivePortfolioAmount(tenantId: string) {
    const [loansActive, creditsActive] = await Promise.all([
      this.db
        .select({ total: sum(loans.disbursedAmount) })
        .from(loans)
        .where(
          and(
            eq(loans.tenantId, tenantId),
            inArray(loans.status, ACTIVE_LOAN_STATUSES),
          ),
        ),
      this.db
        .select({ total: sum(credits.requestedAmount) })
        .from(credits)
        .where(
          and(
            eq(credits.tenantId, tenantId),
            inArray(credits.status, ACTIVE_CREDIT_STATUSES),
          ),
        ),
    ]);

    return (
      Number(loansActive[0]?.total ?? 0) +
      Number(creditsActive[0]?.total ?? 0)
    );
  }

  private async getPendingRequests(tenantId: string, isSavings: boolean) {
    const [withdrawals, loansRequested, loansApproved, loansDisbursement, drafts, pendingInvoices] =
      await Promise.all([
        isSavings
          ? this.db
            .select({
              count: count(),
              totalAmount: sum(withdrawalsAssociates.disbursedAmount),
            })
            .from(withdrawalsAssociates)
            .where(
              and(
                eq(withdrawalsAssociates.tenantId, tenantId),
                eq(withdrawalsAssociates.status, 'REQUESTED'),
              ),
            )
          : Promise.resolve([{ count: 0, totalAmount: 0 }]),
        isSavings
          ? this.db
            .select({ count: count() })
            .from(loans)
            .where(
              and(
                eq(loans.tenantId, tenantId),
                eq(loans.status, 'REQUESTED'),
              ),
            )
          : Promise.resolve([{ count: 0 }]),
        isSavings
          ? this.db
            .select({ count: count() })
            .from(loans)
            .where(
              and(
                eq(loans.tenantId, tenantId),
                eq(loans.status, 'APPROVED'),
              ),
            )
          : Promise.resolve([{ count: 0 }]),
        isSavings
          ? this.db
            .select({ count: count() })
            .from(loans)
            .where(
              and(
                eq(loans.tenantId, tenantId),
                eq(loans.status, 'PENDING_DISBURSEMENT_BANK_BATCH'),
              ),
            )
          : Promise.resolve([{ count: 0 }]),
        this.db
          .select({ count: count() })
          .from(accountingEntries)
          .where(
            and(
              eq(accountingEntries.tenantId, tenantId),
              eq(accountingEntries.status, 'DRAFT'),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(supplierInvoices)
          .where(
            and(
              eq(supplierInvoices.tenantId, tenantId),
              sql`${supplierInvoices.status} IN ('DRAFT', 'APPROVED')`,
            ),
          ),
      ]);

    return {
      withdrawals: {
        requestedCount: Number(withdrawals[0]?.count ?? 0),
        requestedAmount: Number(withdrawals[0]?.totalAmount ?? 0),
      },
      loans: {
        requestedCount: Number(loansRequested[0]?.count ?? 0),
        approvedCount: Number(loansApproved[0]?.count ?? 0),
        pendingDisbursementCount: Number(loansDisbursement[0]?.count ?? 0),
      },
      accountingDrafts: Number(drafts[0]?.count ?? 0),
      pendingSupplierInvoices: Number(pendingInvoices[0]?.count ?? 0),
    };
  }

  private async getFinanceStats(tenantId: string) {
    const [activeCycle, bankBalances, cycleBalances] = await Promise.all([
      this.db
        .select()
        .from(accountingCycles)
        .where(
          and(
            eq(accountingCycles.tenantId, tenantId),
            eq(accountingCycles.status, 'OPEN'),
          ),
        )
        .limit(1),
      this.db
        .select({ total: sum(bankAccounts.currentBalance) })
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.tenantId, tenantId),
            eq(bankAccounts.isActive, true),
          ),
        ),
      this.getCycleBalance(tenantId),
    ]);

    return {
      activeCycle: activeCycle[0]
        ? {
          id: activeCycle[0].id,
          startDate: activeCycle[0].startDate,
          endDate: activeCycle[0].endDate,
          description: activeCycle[0].description,
          status: activeCycle[0].status,
        }
        : null,
      bankBalancesTotal: Number(bankBalances[0]?.total ?? 0),
      cycleBalances,
    };
  }

  private async getCycleBalance(tenantId: string) {
    const [openCycle] = await this.db
      .select({ id: accountingCycles.id })
      .from(accountingCycles)
      .where(
        and(
          eq(accountingCycles.tenantId, tenantId),
          eq(accountingCycles.status, 'OPEN'),
        ),
      )
      .limit(1);

    if (!openCycle) {
      return { totalDebit: 0, totalCredit: 0 };
    }

    const [balances] = await this.db
      .select({
        totalDebit: sum(accountBalances.debitBalance),
        totalCredit: sum(accountBalances.creditBalance),
      })
      .from(accountBalances)
      .where(
        and(
          eq(accountBalances.tenantId, tenantId),
          eq(accountBalances.accountingCyclesId, openCycle.id),
        ),
      );

    return {
      totalDebit: Number(balances?.totalDebit ?? 0),
      totalCredit: Number(balances?.totalCredit ?? 0),
    };
  }

  private async getAlerts(tenantId: string) {
    const [lowStock, upcomingPayables] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            lte(products.stockOnHand, products.reorderPoint),
          ),
        ),
      this.db
        .select({
          id: accountsPayable.id,
          dueDate: accountsPayable.dueDate,
          remainingAmount: accountsPayable.remainingAmount,
          currencyCode: accountsPayable.currencyCode,
          supplierName: suppliers.name,
        })
        .from(accountsPayable)
        .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
        .where(
          and(
            eq(accountsPayable.tenantId, tenantId),
            eq(accountsPayable.status, 'PENDING'),
            gte(accountsPayable.dueDate, new Date().toISOString().split('T')[0]),
          ),
        )
        .orderBy(asc(accountsPayable.dueDate))
        .limit(5),
    ]);

    return {
      lowStockProducts: Number(lowStock[0]?.count ?? 0),
      upcomingPayables: upcomingPayables.map((p) => ({
        id: p.id,
        supplierName: p.supplierName ?? 'Sin proveedor',
        dueDate: p.dueDate ?? '',
        remainingAmount: Number(p.remainingAmount ?? 0),
        currencyCode: p.currencyCode ?? 'VES',
      })),
    };
  }

  private async getAuditStats(tenantId: string) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [failedLogins, recentEvents] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(loginAttempts)
        .where(
          sql`${loginAttempts.success} = false AND ${loginAttempts.createdAt} >= ${twentyFourHoursAgo}::timestamptz`,
        ),
      this.db
        .select({
          id: auditEvents.id,
          action: auditEvents.action,
          targetType: auditEvents.targetType,
          description: auditEvents.description,
          createdAt: auditEvents.createdAt,
          username: users.username,
          userFullname: users.fullname,
        })
        .from(auditEvents)
        .leftJoin(users, eq(auditEvents.userId, users.id))
        .where(eq(auditEvents.tenantId, tenantId))
        .orderBy(desc(auditEvents.createdAt))
        .limit(5),
    ]);

    return {
      recentFailedLogins: Number(failedLogins[0]?.count ?? 0),
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        action: e.action,
        targetType: e.targetType,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
        username: e.username,
        userFullname: e.userFullname,
      })),
    };
  }

  private async getSavingsStats(tenantId: string) {
    const [
      associateCounts,
      withdrawalsAgg,
      liquidationsAgg,
      loanAgg,
      creditAgg,
    ] = await Promise.all([
      this.getAssociateCounts(tenantId),
      this.getWithdrawalsStats(tenantId),
      this.getLiquidationsStats(tenantId),
      this.getLoanStats(tenantId),
      this.getCreditStats(tenantId),
    ]);

    return {
      ...associateCounts,
      withdrawals: withdrawalsAgg,
      liquidations: liquidationsAgg,
      loans: loanAgg,
      credits: creditAgg,
    };
  }

  private async getAssociateCounts(tenantId: string) {
    const [total, active] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(associates)
        .where(eq(associates.tenantId, tenantId)),
      this.db
        .select({ count: count() })
        .from(associates)
        .where(
          and(
            eq(associates.tenantId, tenantId),
            eq(associates.status, 'ACTIVE'),
          ),
        ),
    ]);

    return {
      totalAssociates: Number(total[0]?.count ?? 0),
      activeAssociates: Number(active[0]?.count ?? 0),
    };
  }

  private async getWithdrawalsStats(tenantId: string) {
    const [result] = await this.db
      .select({
        count: count(),
        totalAmount: sum(withdrawalsAssociates.disbursedAmount),
      })
      .from(withdrawalsAssociates)
      .where(eq(withdrawalsAssociates.tenantId, tenantId));

    return {
      count: Number(result?.count ?? 0),
      totalAmount: Number(result?.totalAmount ?? 0),
    };
  }

  private async getLiquidationsStats(tenantId: string) {
    const [result] = await this.db
      .select({
        count: count(),
        totalAmount: sum(liquidationsAssociates.netLiquidationAmount),
      })
      .from(liquidationsAssociates)
      .where(eq(liquidationsAssociates.tenantId, tenantId));

    return {
      count: Number(result?.count ?? 0),
      totalAmount: Number(result?.totalAmount ?? 0),
    };
  }

  private async getLoanStats(tenantId: string) {
    const baseWhere = eq(loans.tenantId, tenantId);

    const [active, pending, paid, total, amountResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(loans)
        .where(and(baseWhere, inArray(loans.status, ACTIVE_LOAN_STATUSES))),
      this.db
        .select({ count: count() })
        .from(loans)
        .where(and(baseWhere, inArray(loans.status, PENDING_LOAN_STATUSES))),
      this.db
        .select({ count: count() })
        .from(loans)
        .where(and(baseWhere, inArray(loans.status, PAID_LOAN_STATUSES))),
      this.db.select({ count: count() }).from(loans).where(baseWhere),
      this.db
        .select({ totalAmount: sum(loans.disbursedAmount) })
        .from(loans)
        .where(baseWhere),
    ]);

    return {
      active: Number(active[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
      paid: Number(paid[0]?.count ?? 0),
      total: Number(total[0]?.count ?? 0),
      totalAmount: Number(amountResult[0]?.totalAmount ?? 0),
    };
  }

  private async getCreditStats(tenantId: string) {
    const baseWhere = eq(credits.tenantId, tenantId);

    const [active, pending, paid, total, amountResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(credits)
        .where(
          and(baseWhere, inArray(credits.status, ACTIVE_CREDIT_STATUSES)),
        ),
      this.db
        .select({ count: count() })
        .from(credits)
        .where(
          and(baseWhere, inArray(credits.status, PENDING_CREDIT_STATUSES)),
        ),
      this.db
        .select({ count: count() })
        .from(credits)
        .where(and(baseWhere, inArray(credits.status, PAID_CREDIT_STATUSES))),
      this.db.select({ count: count() }).from(credits).where(baseWhere),
      this.db
        .select({ totalAmount: sum(credits.requestedAmount) })
        .from(credits)
        .where(baseWhere),
    ]);

    return {
      active: Number(active[0]?.count ?? 0),
      pending: Number(pending[0]?.count ?? 0),
      paid: Number(paid[0]?.count ?? 0),
      total: Number(total[0]?.count ?? 0),
      totalAmount: Number(amountResult[0]?.totalAmount ?? 0),
    };
  }

  private async getInventoryStats(tenantId: string) {
    const [productsResult, servicesResult, assetsResult, movementsAmount] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(products)
          .where(eq(products.tenantId, tenantId)),
        this.db
          .select({ count: count() })
          .from(services)
          .where(eq(services.tenantId, tenantId)),
        this.db
          .select({ count: count() })
          .from(fixedAssets)
          .where(eq(fixedAssets.tenantId, tenantId)),
        this.db
          .select({ total: sum(inventoryMovementItems.totalCost) })
          .from(inventoryMovementItems)
          .innerJoin(
            inventoryMovements,
            eq(inventoryMovementItems.movementId, inventoryMovements.id),
          )
          .where(eq(inventoryMovements.tenantId, tenantId)),
      ]);

    return {
      totalProducts: Number(productsResult[0]?.count ?? 0),
      totalServices: Number(servicesResult[0]?.count ?? 0),
      totalFixedAssets: Number(assetsResult[0]?.count ?? 0),
      totalMovementsAmount: Number(movementsAmount[0]?.total ?? 0),
    };
  }

  private async getPurchasingStats(tenantId: string) {
    const [suppliersResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(suppliers)
        .where(eq(suppliers.tenantId, tenantId)),
    ]);

    return {
      totalSuppliers: Number(suppliersResult[0]?.count ?? 0),
    };
  }

  private async getBankingStats(tenantId: string) {
    const [result] = await this.db
      .select({
        totalInflow: sum(bankTransactions.creditAmount),
        totalOutflow: sum(bankTransactions.debitAmount),
      })
      .from(bankTransactions)
      .where(eq(bankTransactions.tenantId, tenantId));

    return {
      totalInflow: Number(result?.totalInflow ?? 0),
      totalOutflow: Number(result?.totalOutflow ?? 0),
    };
  }

  private async getContributionsStats(tenantId: string) {
    const [result] = await this.db
      .select({
        count: count(),
        totalAmount: sum(contributionBatches.totalAmount),
      })
      .from(contributionBatches)
      .where(eq(contributionBatches.tenantId, tenantId));

    return {
      count: Number(result?.count ?? 0),
      totalAmount: Number(result?.totalAmount ?? 0),
    };
  }
}
