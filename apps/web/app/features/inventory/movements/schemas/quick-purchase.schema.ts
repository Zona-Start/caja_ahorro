import { z } from 'zod';
import type { InventoryMovement } from './movements.schema';

/**
 * Simplified "quick purchase" form for `EMPRESA_COMERCIAL`.
 *
 * Registers a single product entry into stock via the existing
 * `POST /inventory/movements` endpoint using the `PURCHASE_RECEIPT` movement.
 */
export const quickPurchaseFormSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity: z.coerce
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  unitCost: z.coerce
    .number()
    .min(0, 'El costo no puede ser negativo')
    .default(0),
  supplierId: z.string().uuid().optional(),
  invoiceNumber: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export type QuickPurchaseForm = z.infer<typeof quickPurchaseFormSchema>;

export function toQuickPurchasePayload(
  form: QuickPurchaseForm,
): InventoryMovement {
  return {
    movementType: 'PURCHASE_RECEIPT',
    movementDate: new Date(),
    description: form.description ?? 'Compra rápida',
    supplierId: form.supplierId ?? null,
    invoiceNumber: form.invoiceNumber ?? null,
    items: [
      {
        productId: form.productId,
        quantity: form.quantity,
        unitCost: form.unitCost,
        totalCost: form.quantity * form.unitCost,
      },
    ],
  };
}
