import { z } from 'zod';
import { PurchaseTypeEnum } from './purchase-order-options';

export const purchaseOrderItemSchema = z
  .object({
    id: z.number().optional(),
    lineType: z.nativeEnum(PurchaseTypeEnum),
    itemId: z.number().optional().nullable(), // This will be used for productId, fixedAssetId, serviceId, or expenseAccountId
    itemName: z.string(), // Validated in superRefine
    description: z.string().optional().nullable(),
    quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
    totalCost: z.number().optional(), // This will be calculated
    unitCost: z.coerce
      .number()
      .min(0, 'El costo unitario no puede ser negativo'),
    expenseAccountId: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.lineType === PurchaseTypeEnum.SALES_INVENTORY && !data.itemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe seleccionar un producto.',
        path: ['productId'],
      });
    }
    if (data.lineType === PurchaseTypeEnum.FIXED_ASSET && !data.itemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe seleccionar un activo fijo.',
        path: ['fixedAssetId'],
      });
    }
    if (data.lineType === PurchaseTypeEnum.SERVICE && !data.itemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe seleccionar un servicio.',
        path: ['serviceId'],
      });
    }
    if (
      data.lineType === PurchaseTypeEnum.EXPENSE &&
      (!data.itemName || data.itemName.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre del item es requerido.',
        path: ['itemName'],
      });
    }
  });

export const purchaseOrderSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'Proveedor requerido' }),
  status: z.string().optional(),
  orderDate: z.date({ required_error: 'Fecha de orden requerida' }),
  expectedDeliveryDate: z.date().optional().nullable(),
  subtotal: z.coerce.number().min(0, 'El subtotal no puede ser negativo'),
  taxAmount: z.coerce.number().optional().nullable(),
  totalAmount: z.coerce.number().min(0, 'El monto total no puede ser negativo'),
  observations: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe haber al menos un item'),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
