import { z } from 'zod';

export const createPaymentBatchItemSchema = z.object({
  type: z.enum(['LOAN', 'WITHDRAWAL', 'LIQUIDATION']),
  sourceId: z.string().uuid('ID de origen requerido'),
});

export const createPaymentBatchSchema = z.object({
  bankAccountId: z.string().uuid('Cuenta bancaria requerida'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  description: z.string().optional(),
  items: z
    .array(createPaymentBatchItemSchema)
    .min(1, 'Debe seleccionar al menos un registro'),
});

export const confirmPaymentBatchItemSchema = z.object({
  itemId: z.string().uuid(),
  processed: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const confirmPaymentBatchSchema = z.object({
  processedAt: z.string().min(1, 'Fecha de procesamiento requerida'),
  bankReference: z.string().optional(),
  items: z.array(confirmPaymentBatchItemSchema).min(1),
});

export const filterPaymentBatchSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.enum(['DRAFT', 'UPLOADED', 'PROCESSED', 'CANCELLED']).optional().nullable(),
  search: z.string().optional().nullable(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreatePaymentBatchItem = z.infer<typeof createPaymentBatchItemSchema>;
export type CreatePaymentBatch = z.infer<typeof createPaymentBatchSchema>;
export type ConfirmPaymentBatch = z.infer<typeof confirmPaymentBatchSchema>;
export type FilterPaymentBatch = z.infer<typeof filterPaymentBatchSchema>;
