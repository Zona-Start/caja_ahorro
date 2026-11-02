import { z } from 'zod';

export const sudecaReportTypeSchema = z.enum([
  'financial-situation',
  'income-statement',
  'trial-balance',
]);

export type SudecaReportType = z.infer<typeof sudecaReportTypeSchema>;

export const sudecaRowSchema = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  previous: z.string(),
  current: z.string(),
  variation: z.string().optional().default('0'),
  debit: z.string().optional(),
  credit: z.string().optional(),
});

export type SudecaRow = z.infer<typeof sudecaRowSchema>;

export const sudecaResponseSchema = z.object({
  type: sudecaReportTypeSchema,
  title: z.string(),
  quarter: z.number(),
  year: z.number(),
  quarterLabel: z.string(),
  previousQuarterLabel: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  previousStartDate: z.string(),
  previousEndDate: z.string(),
  rows: z.array(sudecaRowSchema),
});

export type SudecaResponse = z.infer<typeof sudecaResponseSchema>;
