import { z } from 'zod';
import {
  currencyCodeEnum,
  paymentBatchItemTypeEnum,
  paymentBatchStatusEnum,
} from './payment-batch-options';

export const paymentBatchItemApiSchema = z.object({
  id: z.number(),
  paymentBatchId: z.number(),
  itemType: paymentBatchItemTypeEnum,
  sourceId: z.number(),
  associateAccountId: z.number(),
  beneficiaryAccountNumber: z.string(),
  beneficiaryAccountType: z.string(), // TODO: Define enum if possible
  beneficiaryId: z.string(),
  beneficiaryName: z.string(),
  amount: z.string(), // Numeric as string from backend
  status: z.string(), // TODO: Define enum if possible (PENDING / PROCESSED / REJECTED)
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paymentBatchApiSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  description: z.string().nullable().optional(),
  status: paymentBatchStatusEnum,
  recordCount: z.number(),
  totalAmount: z.string(), // Numeric as string from backend
  currencyCode: currencyCodeEnum,
  bankId: z.number(),
  bankFileName: z.string().nullable().optional(),
  bankReference: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  items: z.array(paymentBatchItemApiSchema).optional(),
  bank: z
    .object({
      id: z.number(),
      name: z.string(),
      accountNumber: z.string(),
      currencyCode: currencyCodeEnum,
    })
    .optional(),
});

export const paymentBatchApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(paymentBatchApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

export const paymentBatchMutationSchema = z.object({
  message: z.string().optional(),
  id: z.number().optional(),
});

export type PaymentBatch = z.infer<typeof paymentBatchApiSchema>;
export type PaymentBatchItem = z.infer<typeof paymentBatchItemApiSchema>;

// Schemas for approved source items
const approvedSourceItemSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  associateName: z.string(),
  associateCedula: z.string(),
  reference: z.string(),
  amount: z.string(),
  approvalDate: z.string(),
});

export const approvedSourceItemsApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(approvedSourceItemSchema),
});
