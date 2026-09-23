import { z } from 'zod';

export const BulkLoanSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  disbursementDate: z.coerce.date().optional(),
});

export type BulkLoanDto = z.infer<typeof BulkLoanSchema>;

export interface BulkLoanRow {
  rowNumber: number;
  cedula: string;
  loanTypeName: string;
  amount: number;
  annualRate?: number;
  expensesPercentage?: number;
  termTypeRaw?: string;
  termUnits?: number;
  startDate?: Date;
  notes?: string;
}

export interface BulkLoanSuccess {
  row: number;
  cedula: string;
  associateName: string;
  reference: string;
}

export interface BulkLoanFailure {
  row: number;
  cedula: string;
  associateName: string | null;
  error: string;
}

export interface BulkLoanResult {
  message: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: BulkLoanSuccess[];
  failures: BulkLoanFailure[];
}
