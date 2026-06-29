import { z } from 'zod';

export const bankMovementApiSchema = z.object({
  id: z.string().uuid(),
  internalCode: z.string().optional(),
  bankAccountId: z.string().uuid(),
  bankAccountName: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  bankCurrencyCode: z.string().nullable().optional(),
  transactionDate: z.string(),
  valueDate: z.string().nullable().optional(),
  paymentMethod: z.string(),
  description: z.string(),
  category: z.string(),
  creditAmount: z.number().nullable().optional(),
  debitAmount: z.number().nullable().optional(),
  resultingBalance: z.number().nullable().optional(),
  bankReference: z.string().nullable().optional(),
  reconciliationStatus: z.string().nullable().optional(),
  internalLinkStatus: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankMovementApi = z.infer<typeof bankMovementApiSchema>;

export const bankMovementListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankMovementApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

export const bankMovementResponseSchema = z.object({
  message: z.string().optional(),
  data: bankMovementApiSchema,
});

export const linkableRecordSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  amount: z.union([z.string(), z.number()]).nullable(),
  date: z.union([z.string(), z.date()]).nullable(),
  concept: z.string(),
});

export const linkableListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(linkableRecordSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

export type LinkableRecord = z.infer<typeof linkableRecordSchema>;
