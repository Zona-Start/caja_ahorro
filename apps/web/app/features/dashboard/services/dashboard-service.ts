import { apiClient } from '@/lib/api-client';

export interface ActiveCycle {
  id: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}

export interface UpcomingPayable {
  id: string;
  supplierName: string;
  dueDate: string;
  remainingAmount: number;
  currencyCode: string;
}

export interface RecentAuditEvent {
  id: string;
  action: string;
  targetType: string;
  description: string | null;
  createdAt: string;
  username: string | null;
  userFullname: string | null;
}

export interface SavingsStats {
  totalAssociates: number;
  activeAssociates: number;
  withdrawals: { count: number; totalAmount: number };
  liquidations: { count: number; totalAmount: number };
  loans: {
    active: number;
    pending: number;
    paid: number;
    total: number;
    totalAmount: number;
  };
  credits: {
    active: number;
    pending: number;
    paid: number;
    total: number;
    totalAmount: number;
  };
}

export interface DashboardStatsResponse {
  businessType: string;
  kpis: {
    totalActiveAssociates: number;
    totalSavingsBalance: number;
    activePortfolioAmount: number;
    pendingAccountsPayableAmount: number;
  };
  pendingRequests: {
    withdrawals: { requestedCount: number; requestedAmount: number };
    loans: {
      requestedCount: number;
      approvedCount: number;
      pendingDisbursementCount: number;
    };
    accountingDrafts: number;
    pendingSupplierInvoices: number;
  };
  finance: {
    activeCycle: ActiveCycle | null;
    bankBalancesTotal: number;
    cycleBalances: { totalDebit: number; totalCredit: number };
  };
  alerts: {
    lowStockProducts: number;
    upcomingPayables: UpcomingPayable[];
  };
  audit: {
    recentFailedLogins: number;
    recentEvents: RecentAuditEvent[];
  };
  savings: SavingsStats | null;
  contributions: { totalAmount: number; count: number };
  inventory: {
    totalProducts: number;
    totalServices: number;
    totalFixedAssets: number;
    totalMovementsAmount: number;
  };
  purchasing: { totalSuppliers: number };
  banking: { totalInflow: number; totalOutflow: number };
}

export const dashboardService = {
  getStats: () =>
    apiClient
      .get<DashboardStatsResponse>('/stats/dashboard')
      .then((r) => r.data),
};
