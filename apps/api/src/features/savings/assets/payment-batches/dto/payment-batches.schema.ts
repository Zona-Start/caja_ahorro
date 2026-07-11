import {
  CurrencyCodeEnum,
  paymentBatchItemType,
  paymentBatchStatus,
} from '@/types/enum';
import { z } from 'zod';

export const CreatePaymentBatchItemSchema = z.object({
  type: z.nativeEnum(paymentBatchItemType),
  sourceId: z.string().uuid(),
});

export const CreatePaymentBatchSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  currencyCode: z.nativeEnum(CurrencyCodeEnum).optional(),
  description: z.string().optional(),
  items: z.array(CreatePaymentBatchItemSchema).min(1),
});

export const CreateSinglePaymentBatchItemSchema = z.object({
  tenantId: z.string().uuid().optional(),
  type: z.nativeEnum(paymentBatchItemType),
  sourceId: z.string().uuid(),
  beneficiaryAccountNumber: z.string().min(1),
  beneficiaryId: z.string().min(1),
  beneficiaryName: z.string().min(1),
  currencyCode: z.nativeEnum(CurrencyCodeEnum),
  amount: z.number().nonnegative(),
  bankAccountId: z.string().uuid(),
});

export const ConfirmPaymentBatchItemSchema = z.object({
  itemId: z.string().uuid(),
  processed: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const ConfirmPaymentBatchSchema = z.object({
  processedAt: z.string().datetime(),
  bankReference: z.string().min(1).optional(),
  items: z.array(ConfirmPaymentBatchItemSchema).min(1),
});

export const FilterPaymentBatchSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z.nativeEnum(paymentBatchStatus).optional(),
  tenantId: z.string().uuid().optional(),
});

export type CreatePaymentBatchDto = z.infer<typeof CreatePaymentBatchSchema>;
export type CreateSinglePaymentBatchItemDto = z.infer<
  typeof CreateSinglePaymentBatchItemSchema
>;
export type ConfirmPaymentBatchDto = z.infer<typeof ConfirmPaymentBatchSchema>;
export type ConfirmPaymentBatchItemDto = z.infer<typeof ConfirmPaymentBatchItemSchema>;
export type FilterPaymentBatchDto = z.infer<typeof FilterPaymentBatchSchema>;
