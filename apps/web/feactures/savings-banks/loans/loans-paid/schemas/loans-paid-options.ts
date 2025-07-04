import { z } from 'zod';

export const LOAN_PAYMENT_TYPES = {
  PAYING: 'ABONA A PRESTAMO',
  CANCELLATION: 'CANCELA PRESTAMO',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  DEPOSIT: 'DEPÓSITO',
  MOBILE_PAYMENT: 'PAGO_MÓVIL',
  OTHER: 'OTRO',
} as const;

export const PAYMENT_STATUS = {
  DONE: 'REALIZADO',
  CANCELED: 'CANCELADO',
} as const;

export type LoanPaymentTypes = keyof typeof LOAN_PAYMENT_TYPES;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

// Enums equivalentes a los de la base de datos
export const loanPaymentTypeEnum = z.enum(['PAYING', 'CANCELLATION']);
export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'OTHER',
  'MOBILE_PAYMENT',
]);
