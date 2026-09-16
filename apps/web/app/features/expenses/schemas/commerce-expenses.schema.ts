import { z } from 'zod';
import type { ExpenseForm } from './expenses.schema';

/**
 * Simplified expense form for `EMPRESA_COMERCIAL`.
 *
 * The `AGILE` expense mode only requires a category, an amount, a description
 * and an active cash-register session. `toCommerceExpensePayload` fills the
 * rest of the `CreateExpenseSchema` contract with safe defaults.
 */
export const commerceExpenseFormSchema = z.object({
  categoryId: z.string().uuid('La categoría de gasto es requerida'),
  amount: z.coerce
    .number()
    .positive('El monto debe ser mayor a cero'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'Máximo 255 caracteres'),
  cashRegisterSessionId: z
    .string()
    .uuid('Selecciona una caja POS con sesión abierta'),
  supplierId: z.string().uuid().optional(),
  receiptNumber: z.string().max(100).optional(),
});

export type CommerceExpenseForm = z.infer<typeof commerceExpenseFormSchema>;

export function toCommerceExpensePayload(
  form: CommerceExpenseForm,
): ExpenseForm {
  return {
    categoryId: form.categoryId,
    paymentSource: 'CASH_REGISTER',
    amount: form.amount,
    description: form.description,
    currencyCode: 'VES',
    exchangeRate: 1,
    taxAmountBase: 0,
    nature: 'VARIABLE',
    type: 'EXPRESS',
    overrideBudget: false,
    cashRegisterSessionId: form.cashRegisterSessionId,
    supplierId: form.supplierId,
    receiptNumber: form.receiptNumber,
  };
}
