import { z } from 'zod';
import { purchaseItemTypeEnum, PurchaseTypeEnum } from './purchase-order-options';

export const purchaseOrderItemSchema = z.object({
  id: z.number().optional(),
  lineType: z.nativeEnum(purchaseItemTypeEnum),
  itemName: z.string().min(1, 'El nombre del item es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().min(0, 'El costo unitario no puede ser negativo'),
  totalCost: z.coerce.number().min(0, 'El costo total no puede ser negativo'),
  productId: z.number().optional().nullable(),
  fixedAssetId: z.number().optional().nullable(),
  expenseAccountId: z.number().optional().nullable(),
});

export const purchaseOrderSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'Proveedor requerido' }),
  orderNumber: z.string().min(1, 'Número de orden requerido'),
  orderType: z.nativeEnum(PurchaseTypeEnum), // Assuming PurchaseTypeEnum covers orderType
  status: z.string().optional(),
  orderDate: z.date({ required_error: 'Fecha de orden requerida' }),
  expectedDeliveryDate: z.date().optional().nullable(),
  subtotal: z.coerce.number().min(0, 'El subtotal no puede ser negativo'),
  taxAmount: z.coerce.number().optional().nullable(),
  totalAmount: z.coerce.number().min(0, 'El monto total no puede ser negativo'),
  currencyCode: z.string().min(1, 'Código de moneda requerido'),
  observations: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe haber al menos un item'),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
