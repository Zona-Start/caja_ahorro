export class CreditType {
  id: number;
  name: string;
  description?: string;
  interestRate: number;
  termType: 'CUOTAS' | 'PLAZO';
  termUnits: number;
  cancellationPercentage?: number;
  creditAccountChartId: number;
  interestEarnedAccountChartId: number;
  specialQuotaAccountChartId?: number;
  expenseAccountChartId?: number;
  specialQuotaNumber?: number;
  specialQuotaPercentage?: number;
  maxCreditAmount?: number;
  minCreditAmount?: number;
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
