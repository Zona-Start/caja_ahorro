export interface IncomeStatementAccount {
  accountPlanId: number;
  accountCode: string;
  accountName: string;
  level: number;
  balance: string;
  children?: IncomeStatementAccount[];
}

export interface IncomeStatementSection {
  title: string;
  accounts: IncomeStatementAccount[];
  total: string;
}

export interface IncomeStatementResponse {
  revenue: IncomeStatementSection;
  expenses: IncomeStatementSection;
  result: {
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
  };
  cycleInfo: {
    cycleId: number;
    description: string;
    startDate: string;
    endDate: string;
  };
}
