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
  items: z.array(supplierInvoiceItemApiSchema).optional().nullable(),
});

export type SupplierInvoiceSchemaAPI = z.infer<typeof supplierInvoiceApiSchema>;

export const supplierInvoiceMutationResponseSchema = z.object({
  message: z.string(),
});

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
