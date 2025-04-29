export class LoanType {
  id: number;
  name: string;
  description?: string;
  interestRate: number;
  termType: 'CUOTAS' | 'PLAZO';
  termUnits: number;
  cancellationPercentage?: number;
  loanAccountChartId: number;
  interestEarnedAccountChartId: number;
  specialQuotaAccountChartId?: number;
  expenseAccountChartId?: number;
  specialQuotaNumber?: number;
  specialQuotaPercentage?: number;
  maxLoanAmount?: number;
  minLoanAmount?: number;
  payrollTypeId?: number;
  administrativeExpensePercentage?: number;
  minimumSeniorityMonths?: number;
  acceptsDebitBalance?: boolean;
  acceptsGuarantors?: boolean;
  acceptsAvailability?: boolean;
  acceptsRefinancing?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updatedById?: number;
}
