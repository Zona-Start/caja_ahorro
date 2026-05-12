import { z } from 'zod';

export const CreateBankMovementSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.coerce.date(),
  paymentMethod: z.string(),
  description: z.string().min(1),
  bankReference: z.string().optional(),
  category: z.string(),
  creditAmount: z.coerce.number().nonnegative().default(0),
  debitAmount: z.coerce.number().nonnegative().default(0),
  valueDate: z.coerce.date().optional(),
  note: z.string().optional(),
});

export const CreateAndReconcileSchema = z.object({
  tenantId: z.string().uuid().optional(),
  movement: CreateBankMovementSchema,
  links: z
    .array(
      z.object({
        internalRecordType: z.string(),
        internalRecordId: z.string(),
      }),
    )
    .optional(),
});

export const FilterBankMovementSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  sortBy: z.string().optional().default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const LinkToInternalSchema = z.object({
  internalRecordType: z.string(),
  internalRecordId: z.number().int().positive(),
});

export const ReverseMovementSchema = z.object({
  valueDate: z.coerce.date(),
  reason: z.string().optional(),
});

export const GetLinkablesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  q: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateBankMovementDto = z.infer<typeof CreateBankMovementSchema>;
export type CreateAndReconcileDto = z.infer<typeof CreateAndReconcileSchema>;
export type FilterBankMovementDto = z.infer<typeof FilterBankMovementSchema>;
export type LinkToInternalDto = z.infer<typeof LinkToInternalSchema>;
export type ReverseMovementDto = z.infer<typeof ReverseMovementSchema>;
export type GetLinkablesDto = z.infer<typeof GetLinkablesSchema>;
