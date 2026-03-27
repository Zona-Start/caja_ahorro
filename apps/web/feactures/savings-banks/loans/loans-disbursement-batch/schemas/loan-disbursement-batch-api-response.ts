import { z } from 'zod';
import { currencyCodeEnum } from './loan-disbursement/batch-options';

export const loanDisbursementBatchItemApiSchema = z.object({
  id: z.number(),
  loanId: z.number(),
  itemType: z.string(),
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

export const loanDisbursementBatchApiSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  description: z.string().nullable().optional(),
  status: z.string(),
  recordCount: z.number(),
  totalAmount: z.string(), // Numeric as string from backend
  currencyCode: z.enum(currencyCodeEnum),
  loanDisbursementBatchReference: z.string(),
  bankId: z.number(),
  bankFileName: z.string().nullable().optional(),
  bankReference: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  items: z.array(loanDisbursementBatchItemApiSchema).optional(),
  bank: z
    .object({
      id: z.number(),
      name: z.string(),
      accountNumber: z.string(),
      currencyCode: z.enum(currencyCodeEnum),
    })
    .optional(),
});

export const loanDisbursementBatchApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(loanDisbursementBatchApiSchema),
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

export const loanDisbursementBatchMutationSchema = z.object({
  message: z.string().optional(),
  id: z.number().optional(),
});

export type LoanDisbursementBatch = z.infer<typeof loanDisbursementBatchApiSchema>;
export type LoanDisbursementBatchItem = z.infer<typeof loanDisbursementBatchItemApiSchema>;

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
