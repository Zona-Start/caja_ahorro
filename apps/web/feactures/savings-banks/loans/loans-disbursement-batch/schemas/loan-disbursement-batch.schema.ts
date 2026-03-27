import { z } from 'zod';
import {
  currencyCodeEnum,
  loanDisbursementBatchStatusEnum,
} from './loan-disbursement/batch-options';

export const createLoanDisbursementBatchItemSchema = z.object({
  type: z.literal('LOAN'),
  sourceId: z.number().min(1, 'ID de origen requerido'),
});

export const createLoanDisbursementBatchSchema = z.object({
  bankAccountId: z
    .number({
      required_error: 'ID de cuenta bancaria requerido',
    })
    .min(1, 'ID de cuenta bancaria requerido'),
  currencyCode: z.enum(currencyCodeEnum),
  description: z.string().optional(),
  items: z
    .array(createLoanDisbursementBatchItemSchema)
    .min(1, 'Debe haber al menos un ítem'),
});

export const itemResultSchema = z.object({
  itemId: z.number(),
  status: z.enum(['PROCESSED', 'REJECTED']),
  reason: z.string().optional().nullable(),
});

export const confirmLoanDisbursementBatchSchema = z.object({
  bankReference: z.string().optional().nullable(),
  processedAt: z
    .string()
    .datetime({ message: 'Fecha de procesamiento inválida' }),
  items: z
    .array(itemResultSchema)
    .min(1, 'Debe haber al menos un resultado de ítem'),
});

export const filterLoanDisbursementBatchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  status: z.enum(loanDisbursementBatchStatusEnum).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateLoanDisbursementBatch = z.infer<typeof createLoanDisbursementBatchSchema>;
export type ConfirmLoanDisbursementBatch = z.infer<typeof confirmLoanDisbursementBatchSchema>;
export type FilterLoanDisbursementBatch = z.infer<typeof filterLoanDisbursementBatchSchema>;
