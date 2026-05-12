import { z } from 'zod';
import { supplierInvoiceSchema } from './supplier-invoice.schema';

export const supplierInvoiceApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  supplier: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  purchaseOrderId: z.number().optional().nullable(),
  purchaseOrder: z
    .object({
      id: z.number(),
      orderNumber: z.string(),
    })
    .optional()
    .nullable(),
  invoiceNumber: z.string(),
  controlNumber: z.string().optional().nullable(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paymentType: z.string(),
  status: z.string(),
  observations: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        lineType: z.string(),
        itemId: z.number().optional().nullable(),
        expenseAccountId: z.number().optional().nullable(),
        description: z.string(),
        quantity: z.number(),
        unitCost: z.number(),
        totalLine: z.number(),
      }),
    )
    .optional()
    .default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierInvoiceApi = z.infer<typeof supplierInvoiceApiSchema>;

export const supplierInvoiceListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierInvoiceApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
    })
    .optional(),
});

export const supplierInvoiceResponseSchema = z.object({
  message: z.string().optional(),
  data: supplierInvoiceApiSchema,
});

export const supplierInvoiceDeleteResponseSchema = z.object({
  message: z.string(),
});
