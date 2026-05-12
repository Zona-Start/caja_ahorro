import { z } from 'zod';

export const CREDIT_PAYMENT_TYPES = {
  REGULAR: 'Ordinario',
  SPECIAL: 'Especial',
  EXTRAORDINARY: 'Extraordinario',
  INTEREST_ONLY: 'Solo Intereses',
  FULL_SETTLEMENT: 'Cancelación Total',
} as const;

export type CreditPaymentType = keyof typeof CREDIT_PAYMENT_TYPES;

export const creditPaymentTypeEnum = z.enum([
  'REGULAR',
  'SPECIAL',
  'EXTRAORDINARY',
  'INTEREST_ONLY',
  'FULL_SETTLEMENT',
]);

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  PAYROLL_DEDUCTION: 'Descuento por Nómina',
  OTHER: 'Otro',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'MOBILE_PAYMENT',
  'PAYROLL_DEDUCTION',
  'OTHER',
]);
