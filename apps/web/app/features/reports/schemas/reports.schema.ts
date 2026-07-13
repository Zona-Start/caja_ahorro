import { z } from 'zod';

export const associatesReportFilterSchema = z.object({
  status: z.string().optional(),
  isPayrollCredit: z.string().optional(),
  gender: z.string().optional(),
  associatedTypeId: z.string().optional(),
  payrollTypeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type AssociatesReportFilters = z.infer<typeof associatesReportFilterSchema>;

export const haberesReportFilterSchema = z.object({
  type: z.string().optional(),
  cedula: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type HaberesReportFilters = z.infer<typeof haberesReportFilterSchema>;

export const withdrawalReportFilterSchema = z.object({
  cedula: z.string().optional(),
  withdrawalTypeId: z.string().optional(),
  reference: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type WithdrawalReportFilters = z.infer<typeof withdrawalReportFilterSchema>;

export const variationReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type VariationReportFilters = z.infer<typeof variationReportFilterSchema>;

export const loanReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  loanTypeId: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type LoanReportFilters = z.infer<typeof loanReportFilterSchema>;

export const quotaReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reference: z.string().optional(),
  cedula: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type QuotaReportFilters = z.infer<typeof quotaReportFilterSchema>;

export const creditReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  creditTypeId: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type CreditReportFilters = z.infer<typeof creditReportFilterSchema>;

export const creditQuotaReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reference: z.string().optional(),
  cedula: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export type CreditQuotaReportFilters = z.infer<typeof creditQuotaReportFilterSchema>;
