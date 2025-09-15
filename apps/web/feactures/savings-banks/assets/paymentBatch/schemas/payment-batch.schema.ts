import { z } from 'zod';
import {
  currencyCodeEnum,
  paymentBatchStatusEnum,
} from './payment-batch-options';

export const createPaymentBatchItemSchema = z.object({
  type: z.enum(['LOAN', 'WITHDRAWAL', 'LIQUIDATION']),
  sourceId: z.number().min(1, 'ID de origen requerido'),
});

export const createPaymentBatchSchema = z.object({
  bankAccountId: z
    .number({
      required_error: 'ID de cuenta bancaria requerido',
    })
    .min(1, 'ID de cuenta bancaria requerido'),
  currencyCode: currencyCodeEnum,
  description: z.string().optional(),
  items: z
    .array(createPaymentBatchItemSchema)
    .min(1, 'Debe haber al menos un ítem'),
});

export const itemResultSchema = z.object({
  itemId: z.number(),
  status: z.enum(['PROCESSED', 'REJECTED']),
  reason: z.string().optional().nullable(),
});

export const confirmPaymentBatchSchema = z.object({
  bankReference: z.string().optional().nullable(),
  processedAt: z
    .string()
    .datetime({ message: 'Fecha de procesamiento inválida' }),
  items: z
    .array(itemResultSchema)
    .min(1, 'Debe haber al menos un resultado de ítem'),
});

export const filterPaymentBatchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  status: paymentBatchStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreatePaymentBatch = z.infer<typeof createPaymentBatchSchema>;
export type ConfirmPaymentBatch = z.infer<typeof confirmPaymentBatchSchema>;
export type FilterPaymentBatch = z.infer<typeof filterPaymentBatchSchema>;
