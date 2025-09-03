
import { z } from 'zod';
import { PaymentMethodEnum } from './supplier-payment-options';

export const supplierPaymentLineSchema = z.object({
  id: z.number().optional(),
  accountsPayableId: z.number().optional().nullable(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  description: z.string().optional().nullable(),
});

export const supplierPaymentSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'El proveedor es requerido' }),
  totalAmount: z.coerce.number(),
  currencyCode: z.string(), // Debería venir de la configuración general
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankAccountId: z.number().optional().nullable(),
  observations: z.string().optional().nullable(),
  lines: z.array(supplierPaymentLineSchema).min(1, 'Debe haber al menos una factura o anticipo a pagar.'),
  // Campos de solo lectura
  paymentNumber: z.string().optional(),
  status: z.string().optional(),
  requestedAt: z.date().optional(),
});

export type SupplierPayment = z.infer<typeof supplierPaymentSchema>;
export type SupplierPaymentLine = z.infer<typeof supplierPaymentLineSchema>;
