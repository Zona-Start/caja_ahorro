import { z } from 'zod';
import { supplierInvoiceSchema } from './supplier-invoice.schema';

export const supplierInvoiceApiSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplier: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  purchaseOrderId: z.string().optional().nullable(),
  inventoryMovementId: z.string().optional().nullable(),
  purchaseOrder: z
    .object({
      id: z.string(),
      orderNumber: z.string(),
    })
    .optional()
    .nullable(),
  invoiceNumber: z.string(),
  controlNumber: z.string().optional().nullable(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  subtotal: z.coerce.number(),
  taxAmount: z.coerce.number(),
  totalAmount: z.coerce.number(),
  paymentType: z.string(),
  status: z.string(),
  currencyCode: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  bankReference: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        lineType: z.string(),
        itemId: z.string().optional().nullable(),
        expenseAccountId: z.string().optional().nullable(),
        description: z.string(),
        quantity: z.number(),
        unitCost: z.coerce.number(),
        totalLine: z.coerce.number(),
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
