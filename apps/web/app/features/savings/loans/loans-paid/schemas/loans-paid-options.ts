import { z } from 'zod';

export const LOAN_PAYMENT_TYPES = {
  REGULAR: 'Regular',
  EXTRAORDINARY: 'Extraordinario',
  ADVANCED: 'Adelantado',
  REFINANCING: 'Refinanciamiento',
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
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  REVERSED: 'Reversado',
} as const;

export type LoanPaymentType = keyof typeof LOAN_PAYMENT_TYPES;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'MOBILE_PAYMENT',
  'OTHER',
]);

export const paymentTypeEnum = z.enum([
  'REGULAR',
  'EXTRAORDINARY',
  'ADVANCED',
  'REFINANCING',
]);
