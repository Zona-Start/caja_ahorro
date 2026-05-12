import { z } from 'zod';

export const CreateAccountPayableSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  supplierInvoiceId: z.string().uuid(),
  originalAmount: z.coerce.number(),
  paidAmount: z.coerce.number().optional(),
  remainingAmount: z.coerce.number(),
  currencyCode: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.string().optional(),
  isAuthorizePayment: z.boolean().optional(),
  observations: z.string().optional(),
});

export const FilterAccountPayableSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.string().optional().default('asc'),
  supplierId: z.string().uuid().optional(),
  supplierInvoiceId: z.string().uuid().optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  isAuthorizePayment: z.string().optional(),
});

export const UpdateAccountPayableSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  supplierInvoiceId: z.string().uuid().optional(),
  originalAmount: z.coerce.number().optional(),
  paidAmount: z.coerce.number().optional(),
  remainingAmount: z.coerce.number().optional(),
  currencyCode: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.string().optional(),
  isAuthorizePayment: z.boolean().optional(),
  observations: z.string().optional(),
});

export const CreateAdvanceSupplierSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  amount: z.coerce.number(),
  observations: z.string().optional(),
});

export const CreateSupplierTransactionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  transactionType: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']),
  supplierId: z.string().uuid(),
  accountsPayableId: z.string().uuid().optional(),
  amount: z.coerce.number(),
  reason: z.string(),
  observations: z.string().optional(),
});

export type CreateAccountPayableDto = z.infer<typeof CreateAccountPayableSchema>;
export type FilterAccountPayableDto = z.infer<typeof FilterAccountPayableSchema>;
export type UpdateAccountPayableDto = z.infer<typeof UpdateAccountPayableSchema>;
export type CreateAdvanceSupplierDto = z.infer<typeof CreateAdvanceSupplierSchema>;
export type CreateSupplierTransactionDto = z.infer<typeof CreateSupplierTransactionSchema>;
