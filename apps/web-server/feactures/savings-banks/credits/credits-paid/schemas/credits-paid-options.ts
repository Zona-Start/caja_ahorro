import { z } from 'zod';

export const CREDIT_PAYMENT_TYPES = {
  PAYING: 'Abona a Crédito',
  CANCELLATION: 'Cancela Crédito',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Trasnferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
} as const;

export type LoanPaymentTypes = keyof typeof CREDIT_PAYMENT_TYPES;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;

// Enums equivalentes a los de la base de datos
export const creditPaymentTypeEnum = z.enum(['PAYING', 'CANCELLATION']);
export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'OTHER',
  'MOBILE_PAYMENT',
]);
