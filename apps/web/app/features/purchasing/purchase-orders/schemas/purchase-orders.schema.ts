import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  lineType: z.string().min(1, 'El tipo de línea es requerido'),
  itemId: z.string().min(1, 'El artículo/servicio es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.coerce.number().min(0, 'El costo unitario debe ser >= 0'),
  totalCost: z.coerce.number().min(0),
});

export const purchaseOrderSchema = z.object({
  id: z.number().int().positive().optional(),
  supplierId: z.number().int().positive('Debe seleccionar un proveedor'),
  orderDate: z.date({ required_error: 'La fecha de orden es requerida' }),
  expectedDeliveryDate: z.date({
    required_error: 'La fecha de entrega esperada es requerida',
  }),
  status: z
    .enum(['DRAFT', 'APPROVED', 'INVOICED', 'CANCELLED'])
    .default('DRAFT'),
  subtotal: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().min(0).default(0),
  currencyCode: z.string().min(1, 'El código de moneda es requerido'),
  observations: z.string().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, 'Debe agregar al menos un artículo'),
});

export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
