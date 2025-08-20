import { z } from 'zod';

export const purchaseOrderItemApiSchema = z.object({
  id: z.number().optional(),
  lineType: z.string(),
  description: z.string().optional().nullable(),
  itemId: z.number().optional().nullable(),
  itemName: z.string(),
  quantity: z.coerce.number(),
  unitCost: z.coerce.number(),
  totalCost: z.coerce.number(),
});

export const purchaseOrderApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  orderNumber: z.string(),
  orderType: z.string(),
  status: z.string().optional(),
  orderDate: z.string(),
  expectedDeliveryDate: z.string().nullable().optional(),
  subtotal: z.coerce.number(),
  taxAmount: z.coerce.number().optional().nullable(),
  totalAmount: z.coerce.number(),
  observations: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemApiSchema).optional().nullable(),
});

export type PurchaseOrderSchemaAPI = z.infer<typeof purchaseOrderApiSchema>;

export const purchaseOrderMutationResponseSchema = z.object({
  message: z.string(),
});

export const purchaseOrderAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(purchaseOrderApiSchema),
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

export const purchaseOrderResponseOneSchema = z.object({
  message: z.string(),
  data: purchaseOrderApiSchema,
});
