import { z } from 'zod';

export const supplierInvoiceItemApiSchema = z.object({
  id: z.number().optional(),
  lineType: z.string(),
  description: z.string().nullable(),
  quantity: z.number(),
  unitCost: z.number(),
  totalLine: z.number(),
  itemId: z.number().optional().nullable(),
  expenseAccountId: z.number().optional().nullable(),
});

export const appliedAdvanceApiSchema = z.object({
  advanceId: z.number(),
  amount: z.number(),
});

export const supplierInvoiceApiSchema = z.object({
  id: z.number(),
  supplierInvoiceNumber: z.string(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  purchaseOrderId: z.number().optional().nullable(),
  invoiceNumber: z.string(),
  controlNumber: z.string().optional().nullable(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  subtotal: z.number(),
  taxAmount: z.number().optional().nullable(),
  totalAmount: z.number(),
  paymentType: z.string().optional(),
  status: z.string().optional(),
  observations: z.string().optional().nullable(),
  bankAccountId: z.number().optional().nullable(),
  chargePayment: z.boolean().optional().nullable(),
  paymentDescription: z.string().optional().nullable(),
  paymentBankReference: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  paymentAmount: z.string().optional().nullable(),
  transactionDate: z.string().optional().nullable(),
  draftAppliedCredits: z.array(appliedAdvanceApiSchema).optional().nullable(),
  items: z.array(supplierInvoiceItemApiSchema).optional().nullable(),
});

export type SupplierInvoiceSchemaAPI = z.infer<typeof supplierInvoiceApiSchema>;

export const supplierInvoiceAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierInvoiceApiSchema),
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

export const supplierInvoiceResponseOneSchema = z.object({
  message: z.string(),
  data: supplierInvoiceApiSchema,
});

export const supplierInvoiceDraftPendingResponseSchema = z.object({
  message: z.string(),
  data: z.array(supplierInvoiceApiSchema),
});

export const supplierInvoiceItemMutationApiSchema = z.object({
  id: z.number().optional(),
  lineType: z.string(),
  description: z.string().nullable(),
  quantity: z.number(),
  unitCost: z.string(),
  totalLine: z.string(),
  itemId: z.number().optional().nullable(),
  expenseAccountId: z.number().optional().nullable(),
});

export const supplierInvoiceMutationApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  purchaseOrderId: z.number().optional().nullable(),
  invoiceNumber: z.string(),
  controlNumber: z.string().optional().nullable(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  subtotal: z.string(),
  taxAmount: z.string().optional().nullable(),
  totalAmount: z.string(),
  paymentType: z.string().optional(),
  status: z.string().optional(),
  observations: z.string().optional().nullable(),
  bankAccountId: z.number().optional().nullable(),
  chargePayment: z.boolean().optional().nullable(),
  paymentDescription: z.string().optional().nullable(),
  paymentBankReference: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  transactionDate: z.string().optional().nullable(),
  items: z.array(supplierInvoiceItemMutationApiSchema).optional().nullable(),
});

export const supplierInvoiceMutationResponseSchema = z.object({
  message: z.string(),
  data: supplierInvoiceMutationApiSchema.optional(),
});
