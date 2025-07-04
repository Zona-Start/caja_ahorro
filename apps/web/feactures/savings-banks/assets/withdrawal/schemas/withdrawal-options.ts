import { z } from 'zod';

export const PAYMENT_METHOD = {
  CASH: 'EFECTIVO',
  BANK_TRANSFER: 'TRANSFERENCIA BANCARIA',
  CHECK: 'CHEQUE',
  DEPOSIT: 'DEPÓSITO',
  MOBILE_PAYMENT: 'PAGO_MÓVIL',
  OTHER: 'OTRO',
} as const;

export const ESTATUS_TYPES = {
  REQUESTED: 'SOLICITADO',
  APPROVED: 'APROBADO',
  REJECTED: 'RECHAZADO',
  CANCELLED: 'CANCELADO',
  PENDING_DISBURSEMENT_BANK_BATCH: 'PENDIENTE DESEMBOLSO BANCO',
  DISBURSED: 'DESEMBOLSADO',
  DISBURSEMENT_FAILED: 'DESEMBOLSO FALLIDO',
  DISBURSED_REVERSED: 'DESEMBOLSO REVERTIDO',
  ADJUSTED: 'AJUSTED',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type StatusType = keyof typeof ESTATUS_TYPES;

// Enums equivalentes a los de la base de datos
export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CHECK',
  'DEPOSIT',
  'OTHER',
  'MOBILE_PAYMENT',
]);
