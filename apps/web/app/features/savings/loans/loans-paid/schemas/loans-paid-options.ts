import { z } from 'zod';

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'MOBILE_PAYMENT',
  'OTHER',
]);

export const LOAN_PAYMENT_TYPES = {
  PAYING: 'Pago de Cuota',
  CANCELLATION: 'Cancelación',
} as const;

export type LoanPaymentType = keyof typeof LOAN_PAYMENT_TYPES;

export const loanPaymentTypeEnum = z.enum(['PAYING', 'CANCELLATION']);
