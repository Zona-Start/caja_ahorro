import { z } from 'zod';

export const bankMovementApiSchema = z.object({
  id: z.number(),
  bankAccountId: z.number(),
  bankAccount: z
    .object({
      id: z.number(),
      accountName: z.string(),
      accountNumber: z.string(),
    })
    .optional(),
  transactionDate: z.string(),
  paymentMethod: z.string(),
  description: z.string(),
  category: z.string(),
  creditAmount: z.number().optional().nullable(),
  debitAmount: z.number().optional().nullable(),
  bankReference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankMovementApi = z.infer<typeof bankMovementApiSchema>;

export const bankMovementMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean().optional().nullable(),
  hasPreviousPage: z.boolean().optional().nullable(),
  nextPage: z.number().optional().nullable(),
  previousPage: z.number().optional().nullable(),
});

export const bankMovementListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankMovementApiSchema),
  meta: bankMovementMetaSchema,
});

export const bankMovementResponseSchema = z.object({
  message: z.string().optional(),
  data: bankMovementApiSchema,
});

export type BankMovementMeta = z.infer<typeof bankMovementMetaSchema>;
export type BankMovementListResponse = z.infer<
  typeof bankMovementListResponseSchema
>;
