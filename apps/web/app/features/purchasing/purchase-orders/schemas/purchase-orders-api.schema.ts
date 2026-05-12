import { z } from 'zod';

export const purchaseOrderApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  orderDate: z.string(),
  expectedDeliveryDate: z.string(),
  status: z.string(),
  subtotal: z.string(),
  taxAmount: z.string(),
  totalAmount: z.string(),
  currencyCode: z.string(),
  observations: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        lineType: z.string(),
        itemId: z.string(),
        description: z.string(),
        quantity: z.string(),
        unitCost: z.string(),
        totalCost: z.string(),
      }),
    )
    .optional(),
});

export type PurchaseOrderApi = z.infer<typeof purchaseOrderApiSchema>;

export const purchaseOrderListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(purchaseOrderApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
      nextPage: z.number().optional().nullable(),
      previousPage: z.number().optional().nullable(),
    })
    .nullable()
    .optional(),
});

export const purchaseOrderSingleResponseSchema = z.object({
  message: z.string().optional(),
  data: purchaseOrderApiSchema,
});

export const purchaseOrderMutationResponseSchema = z.object({
  message: z.string().optional(),
  data: purchaseOrderApiSchema,
});

export const purchaseOrderForInvoiceSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  orderDate: z.string(),
  status: z.string(),
  totalAmount: z.string(),
  currencyCode: z.string(),
});

export type PurchaseOrderForInvoiceApi = z.infer<
  typeof purchaseOrderForInvoiceSchema
>;

export const purchaseOrderForInvoiceListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(purchaseOrderForInvoiceSchema),
});
