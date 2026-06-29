import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  id: z.string().optional(),
  lineType: z.enum(['SALES_INVENTORY', 'SERVICE', 'EXPENSE']),
  itemId: z.string().uuid().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().int('Debe ser un número entero').min(1, 'La cantidad debe ser al menos 1').default(1),
  unitCost: z.coerce.number().min(0).default(0),
  totalCost: z.coerce.number().optional(),
  taxPercent: z.coerce.number().min(0).default(16),
});

export const purchaseOrderSchema = z.object({
  id: z.string().uuid().optional(),
  supplierId: z.string().uuid('Seleccione un proveedor'),
  orderDate: z.string(),
  expectedDeliveryDate: z.string().optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  purchaseExchangeRate: z.coerce.number().min(0).default(1),
  subtotal: z.coerce.number(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  observations: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe tener al menos un ítem'),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
