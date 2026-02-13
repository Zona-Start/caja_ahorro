export interface BalanceSheetAccount {
  accountPlanId: number;
  accountCode: string;
  accountName: string;
  level: number;
  balance: string;
  children?: BalanceSheetAccount[];
}

export interface BalanceSheetSection {
  title: string;
  accounts: BalanceSheetAccount[];
  total: string;
}

export interface BalanceSheetResponse {
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totals: {
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    totalLiabilitiesAndEquity: string;
  };
  cycleInfo: {
    cycleId: number;
    description: string;
    endDate: string;
  };
}
