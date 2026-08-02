import { z } from 'zod';

export const kpiStatsSchema = z.object({
  totalActiveAssociates: z.number(),
  totalSavingsBalance: z.number(),
  activePortfolioAmount: z.number(),
  pendingAccountsPayableAmount: z.number(),
});

export const pendingRequestsSchema = z.object({
  withdrawals: z.object({
    requestedCount: z.number(),
    requestedAmount: z.number(),
  }),
  loans: z.object({
    requestedCount: z.number(),
    approvedCount: z.number(),
    pendingDisbursementCount: z.number(),
  }),
  accountingDrafts: z.number(),
  pendingSupplierInvoices: z.number(),
});

export const activeCycleSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  status: z.string(),
});

export const financeSchema = z.object({
  activeCycle: activeCycleSchema.nullable(),
  bankBalancesTotal: z.number(),
  cycleBalances: z.object({
    totalDebit: z.number(),
    totalCredit: z.number(),
  }),
});

export const upcomingPayableSchema = z.object({
  id: z.string(),
  supplierName: z.string(),
  dueDate: z.string(),
  remainingAmount: z.number(),
  currencyCode: z.string(),
});

export const alertsSchema = z.object({
  lowStockProducts: z.number(),
  upcomingPayables: z.array(upcomingPayableSchema),
});

export const recentAuditEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  targetType: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  username: z.string().nullable(),
  userFullname: z.string().nullable(),
});

export const auditSchema = z.object({
  recentFailedLogins: z.number(),
  recentEvents: z.array(recentAuditEventSchema),
});

export const dashboardStatsSchema = z.object({
  businessType: z.string(),
  kpis: kpiStatsSchema,
  pendingRequests: pendingRequestsSchema,
  finance: financeSchema,
  alerts: alertsSchema,
  audit: auditSchema,
  savings: z
    .object({
      totalAssociates: z.number(),
      activeAssociates: z.number(),
      withdrawals: z.object({
        count: z.number(),
        totalAmount: z.number(),
      }),
      liquidations: z.object({
        count: z.number(),
        totalAmount: z.number(),
      }),
      loans: z.object({
        active: z.number(),
        pending: z.number(),
        paid: z.number(),
        total: z.number(),
        totalAmount: z.number(),
      }),
      credits: z.object({
        active: z.number(),
        pending: z.number(),
        paid: z.number(),
        total: z.number(),
        totalAmount: z.number(),
      }),
    })
    .nullable(),
  contributions: z.object({
    totalAmount: z.number(),
    count: z.number(),
  }),
  inventory: z.object({
    totalProducts: z.number(),
    totalServices: z.number(),
    totalFixedAssets: z.number(),
    totalMovementsAmount: z.number(),
  }),
  purchasing: z.object({
    totalSuppliers: z.number(),
  }),
  banking: z.object({
    totalInflow: z.number(),
    totalOutflow: z.number(),
  }),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type KpiStats = z.infer<typeof kpiStatsSchema>;
export type PendingRequests = z.infer<typeof pendingRequestsSchema>;
export type FinanceStats = z.infer<typeof financeSchema>;
export type AlertsStats = z.infer<typeof alertsSchema>;
export type AuditStats = z.infer<typeof auditSchema>;
