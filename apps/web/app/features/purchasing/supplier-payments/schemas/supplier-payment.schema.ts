import { z } from 'zod';
import { PAYMENT_METHOD, PAYMENT_STATUS, CURRENCY_CODE_OPTIONS } from './supplier-payment-options';

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

export const supplierPaymentFormSchema = z.object({
  supplierName: z.string().min(1, 'El nombre del proveedor es requerido'),
  paymentDescription: z.string().min(1, 'La descripción del pago es requerida'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  currencyCode: z.nativeEnum(CURRENCY_CODE_OPTIONS, {
    errorMap: () => ({ message: 'El código de moneda es requerido' }),
  }),
  paymentMethod: z.nativeEnum(PAYMENT_METHOD, {
    errorMap: () => ({ message: 'El método de pago es requerido' }),
  }),
  bankReference: optionalString,
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha de transacción es requerida' }),
  }),
  status: z.nativeEnum(PAYMENT_STATUS).default('PENDING'),
  accountPayableReference: optionalString,
});

export type SupplierPaymentForm = z.infer<typeof supplierPaymentFormSchema>;

export const supplierPaymentSchema = supplierPaymentFormSchema.extend({
  id: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierPayment = z.infer<typeof supplierPaymentSchema>;

export const supplierPaymentPaySchema = supplierPaymentFormSchema.omit({ status: true });

export type SupplierPaymentPay = z.infer<typeof supplierPaymentPaySchema>;

export const supplierPaymentAdvanceSchema = supplierPaymentPaySchema;

export type SupplierPaymentAdvance = z.infer<typeof supplierPaymentAdvanceSchema>;

export const supplierPaymentReverseSchema = z.object({
  paymentId: z.coerce.number().min(1, 'El ID del pago es requerido'),
  reason: z.string().optional(),
});

export type SupplierPaymentReverse = z.infer<typeof supplierPaymentReverseSchema>;
