import { z } from 'zod';

export const LOAN_PAYMENT_TYPES = {
  PAYING: 'Abona a Préstamo',
  CANCELLATION: 'Cancela Préstamo',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
} as const;

export const PAYMENT_STATUS = {
  DONE: 'Realizado',
  CANCELED: 'Cancelado',
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
