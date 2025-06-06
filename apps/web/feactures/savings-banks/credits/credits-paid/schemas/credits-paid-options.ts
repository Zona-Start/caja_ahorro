import { z } from 'zod';

export const CREDIT_PAYMENT_TYPES = {
  PAYING: 'ABONA A CREDITO',
  CANCELLATION: 'CANCELA CREDITO',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  DEPOSIT: 'DEPÓSITO',
  MOBILE_PAYMENT: 'PAGO_MÓVIL',
  OTHER: 'OTRO',
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
