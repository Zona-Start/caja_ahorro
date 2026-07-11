import { z } from 'zod';

export const CreateSupplierTransactionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  transactionType: z.string(),
  transactionDate: z.coerce.date(),
  amount: z.coerce.number(),
  currencyCode: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  bankReference: z.string().optional(),
  bankTransactionDate: z.coerce.date().optional(),
  observations: z.string().optional(),
});

export const FilterSupplierTransactionSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  transactionType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  supplierId: z.string().uuid().optional(),
});

export const UpdateSupplierTransactionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  observations: z.string().optional(),
  status: z.string().optional(),
  bankReference: z.string().optional(),
});

export type CreateSupplierTransactionDto = z.infer<
  typeof CreateSupplierTransactionSchema
>;
export type FilterSupplierTransactionDto = z.infer<
  typeof FilterSupplierTransactionSchema
>;
export type UpdateSupplierTransactionDto = z.infer<
  typeof UpdateSupplierTransactionSchema
>;
