import { z } from 'zod';

const CreditAppliedSchema = z.object({
  id: z.string().uuid(),
  transactionType: z.string(),
  appliedAmount: z.coerce.number(),
});

export const CreateSupplierPaymentSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  accountPayableId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  paymentDescription: z.string(),
  paymentMethod: z.string(),
  bankReference: z.string(),
  transactionDate: z.coerce.date(),
  amount: z.coerce.number(),
  creditAplied: z.array(CreditAppliedSchema).default([]),
});

export const CreateSupplierPaymentAdvanceSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  transactionId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  paymentDescription: z.string().optional(),
  paymentMethod: z.string(),
  bankReference: z.string().optional(),
  transactionDate: z.coerce.date().optional(),
  amount: z.coerce.number(),
  currencyCode: z.string().optional(),
});

export const FilterSupplierPaymentSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.string().optional().default('asc'),
  supplierIds: z
    .union([z.array(z.string().uuid()), z.string().uuid()])
    .optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const FilterAccountPayableSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('dueDate'),
  sortOrder: z.string().optional().default('asc'),
  supplierId: z.string().uuid().optional(),
  supplierInvoiceId: z.string().uuid().optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  isAuthorizePayment: z.string().optional(),
});

export const ReversePaymentsSchema = z.object({
  paymentIds: z.array(z.string().uuid()),
});

export type CreateSupplierPaymentDto = z.infer<
  typeof CreateSupplierPaymentSchema
>;
export type CreateSupplierPaymentAdvanceDto = z.infer<
  typeof CreateSupplierPaymentAdvanceSchema
>;
export type FilterSupplierPaymentDto = z.infer<
  typeof FilterSupplierPaymentSchema
>;
export type FilterAccountPayableDto = z.infer<
  typeof FilterAccountPayableSchema
>;
export type ReversePaymentsDto = z.infer<typeof ReversePaymentsSchema>;
