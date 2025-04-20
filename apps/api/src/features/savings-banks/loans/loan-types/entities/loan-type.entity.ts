export class LoanType {
  id: number;
  name: string;
  description?: string;
  interestRate_annual?: number;
  maxLoanAmount?: number;
  minLoanAmount?: number;
  termMonthsMin?: number;
  termMonthsMax?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updatedById?: number;
}
