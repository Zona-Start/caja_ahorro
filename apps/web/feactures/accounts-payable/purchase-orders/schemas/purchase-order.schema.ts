import { z } from 'zod';
import { purchaseItemTypeEnum, PurchaseTypeEnum } from './purchase-order-options'; // Ensure PurchaseItemType is exported as an enum, not a type

export const purchaseOrderItemSchema = z.object({
  id: z.number().optional(),
  itemType: z.nativeEnum(purchaseItemTypeEnum),
  itemName: z.string().min(1, 'El nombre del item es requerido'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().min(0, 'El costo unitario no puede ser negativo'),
  totalCost: z.coerce.number().min(0, 'El costo total no puede ser negativo'),
  salesProductId: z.number().optional(),
  fixedAssetId: z.number().optional(),
});

export const purchaseOrderSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'Proveedor requerido' }),
  invoiceNumber: z
    .string()
    .min(1, { message: 'Número de factura requerido' })
    .max(100, {
      message: 'Máximo 100 caracteres',
    }),
  purchaseDate: z.date({ required_error: 'Fecha de compra requerida' }),
  totalAmount: z.coerce
    .number({
      required_error: 'Monto total requerido',
    })
    .min(0, 'El monto debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El monto debe ser un número válido',
    }),
  status: z.string().optional(),
  description: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe haber al menos un item'),
  purchaseType: z.nativeEnum(PurchaseTypeEnum).default(PurchaseTypeEnum.CASH),
  payableId: z.number().optional(),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
