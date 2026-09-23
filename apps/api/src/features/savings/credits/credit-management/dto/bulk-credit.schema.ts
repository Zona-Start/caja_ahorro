import { z } from 'zod';

export const BulkCreditSchema = z.object({
  tenantId: z.string().uuid().optional(),
});

export type BulkCreditDto = z.infer<typeof BulkCreditSchema>;

export interface BulkCreditRow {
  rowNumber: number;
  cedula: string;
  creditTypeName: string;
  amount: number;
  annualRate?: number;
  expensesPercentage?: number;
  termTypeRaw?: string;
  termUnits?: number;
  startDate?: Date;
  notes?: string;
}

export interface BulkCreditSuccess {
  row: number;
  cedula: string;
  associateName: string;
  reference: string;
}

export interface BulkCreditFailure {
  row: number;
  cedula: string;
  associateName: string | null;
  error: string;
}

export interface BulkCreditResult {
  message: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: BulkCreditSuccess[];
  failures: BulkCreditFailure[];
}
