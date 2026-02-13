export interface TrialBalanceAccount {
  accountPlanId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountNature: string;
  level: number;
  initialBalance: string;
  periodDebit: string;
  periodCredit: string;
  currentBalance: string;
}

export interface TrialBalanceSummary {
  totalInitialDebit: string;
  totalInitialCredit: string;
  totalPeriodDebit: string;
  totalPeriodCredit: string;
  totalCurrentDebit: string;
  totalCurrentCredit: string;
}

export interface TrialBalanceResponse {
  accounts: TrialBalanceAccount[];
  summary: TrialBalanceSummary;
  cycleInfo: {
    cycleId: number;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}
