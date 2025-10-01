import { z } from 'zod';
import { PAYMENT_METHOD, BANK_TRANSACTION_CATEGORY, INTERNAL_LINK_STATUS } from './bank-movement-options';

const paymentMethodEnum = z.enum(Object.keys(PAYMENT_METHOD) as [string, ...string[]]);
const bankTransactionCategoryEnum = z.enum(Object.keys(BANK_TRANSACTION_CATEGORY) as [string, ...string[]]);
const internalLinkStatusEnum = z.enum(Object.keys(INTERNAL_LINK_STATUS) as [string, ...string[]]);

export const bankMovementApiSchema = z.object({
  id: z.number(),
  bankAccountId: z.number(),
  transactionType: paymentMethodEnum,
  transactionDate: z.string(),
  valueDate: z.string().nullable().optional(),
  description: z.string(),
  category: bankTransactionCategoryEnum.nullable().optional(),
  bankReference: z.string().nullable().optional(),
  debitAmount: z.string(),
  creditAmount: z.string(),
  resultingBalance: z.string().nullable().optional(),
  internalLinkStatus: internalLinkStatusEnum,
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.number().nullable().optional(),
  updatedById: z.number().nullable().optional(),
});

export type BankMovementApiResponse = z.infer<typeof bankMovementApiSchema>;

export const bankMovementPaginationResponseSchema = z.object({
  data: z.array(bankMovementApiSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const bankMovementResponseSchema = z.object({
    data: bankMovementApiSchema,
    message: z.string(),
});

export const bankMovementDeleteResponseSchema = z.object({
  message: z.string(),
});
