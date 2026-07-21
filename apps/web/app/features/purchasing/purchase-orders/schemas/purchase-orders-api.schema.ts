import { z } from 'zod';

export const purchaseOrderItemApiSchema = z.object({
  id: z.string(),
  purchaseOrderId: z.string().optional(),
  lineType: z.string(),
  productId: z.string().nullable().optional(),
  itemId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  itemName: z.string().nullable().optional(),
  quantity: z.union([z.number(), z.string()]),
  unitCost: z.union([z.number(), z.string()]),
  totalCost: z.union([z.number(), z.string()]).nullable().optional(),
  unitOfMeasure: z.string().nullable().optional(),
  taxPercent: z.union([z.number(), z.string()]).nullable().optional(),
});

export const purchaseOrderApiSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  supplierId: z.string(),
  supplierName: z.string().nullable().optional(),
  status: z.string(),
  orderDate: z.union([z.string(), z.date()]),
  expectedDeliveryDate: z.union([z.string(), z.date()]).nullable().optional(),
  subtotal: z.union([z.number(), z.string()]),
  taxAmount: z.union([z.number(), z.string()]).nullable().optional(),
  totalAmount: z.union([z.number(), z.string()]),
  currencyCode: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  items: z.array(purchaseOrderItemApiSchema).optional(),
});

export const purchaseOrderListApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(purchaseOrderApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});

export type PurchaseOrderApi = z.infer<typeof purchaseOrderApiSchema>;
export type PurchaseOrderItemApi = z.infer<typeof purchaseOrderItemApiSchema>;

export interface PurchaseOrderRaw {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: { name?: string; id?: string } | null;
  supplierName?: string | null;
  status: string;
  orderDate: string | Date;
  expectedDeliveryDate?: string | Date | null;
  subtotal: string | number;
  taxAmount?: string | number | null;
  totalAmount: string | number;
  currencyCode?: string | null;
  observations?: string | null;
  items?: PurchaseOrderItemRaw[];
}

export interface PurchaseOrderItemRaw {
  id: string;
  purchaseOrderId?: string;
  lineType: string;
  productId?: string | null;
  itemId?: string | null;
  description?: string | null;
  itemName?: string | null;
  quantity: number | string;
  unitCost: number | string;
  totalCost?: number | string | null;
  unitOfMeasure?: string | null;
  taxPercent?: number | string | null;
}
