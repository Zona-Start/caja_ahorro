import { z } from 'zod';

export const purchaseOrderItemApiSchema = z.object({
  id: z.number().optional(),
  itemType: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  salesProductId: z.number().optional().nullable(),
  fixedAssetId: z.number().optional().nullable(),
});

// RESPONSE API SCHEMA
export const purchaseOrderApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  invoiceNumber: z.string(),
  purchaseDate: z.string(),
  purchaseType: z.string(),
  totalAmount: z.number(),
  payableId: z.number().optional().nullable(),
  status: z.string().optional(), // Puedes reemplazar por z.enum([...])
  description: z.string().optional(),
  items: z.array(purchaseOrderItemApiSchema).optional().nullable(),
});

//schema response query pagination
export const purchaseOrderResponseAllSchema = z.object({
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

// Response schemas for the API by Create, Update, QuerryOne
export const purchaseOrderResponseOneSchema = z.object({
  message: z.string(),
  data: purchaseOrderApiSchema,
});

//schema response delete mutation
export const purchaseOrderDeleteResponseSchema = z.object({
  message: z.string(),
});

export const purchaseOrderApiCountSchema = z.object({
  totalAmount: z.string().nullable(),
  pendingAmount: z.string().nullable(),
  paidAmount: z.string().nullable(),
  overdueAmount: z.string().nullable(),
});

export const purchaseOrderResponseCountSchema = z.object({
  message: z.string(),
  data: purchaseOrderApiCountSchema,
});
