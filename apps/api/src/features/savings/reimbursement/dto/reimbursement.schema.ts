import { z } from 'zod';

export const ReimbursementOriginTypeSchema = z.enum([
  'LOAN',
  'CREDIT',
  'WITHDRAWAL',
]);

export const ReimbursementItemSchema = z.object({
  originType: ReimbursementOriginTypeSchema,
  originId: z.string().uuid().optional(),
  originReference: z.string().optional(),
  amount: z.coerce.number().positive(),
});

export const CreateReimbursementSchema = z.object({
  associateId: z.string().uuid().optional(),
  cedula: z.string().optional(),
  destination: z.enum(['SAVINGS', 'CASH']),
  items: z.array(ReimbursementItemSchema).min(1),
  bankId: z.string().uuid().nullish(),
  transactionReference: z.string().nullish(),
  paymentDate: z.string().nullish(),
  comment: z.string().nullish(),
});

export type CreateReimbursementDto = z.infer<typeof CreateReimbursementSchema>;

export const FilterReimbursementSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional().default(''),
  status: z.string().optional().default(''),
});

export type FilterReimbursementDto = z.infer<typeof FilterReimbursementSchema>;
