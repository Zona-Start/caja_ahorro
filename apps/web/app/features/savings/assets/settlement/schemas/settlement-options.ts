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
  'OTHER',
  'MOBILE_PAYMENT',
]);

export const ESTATUS_TYPES = {
  REQUESTED: 'Solicitado',
  PROCESSED: 'Aprobado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente desembolso banco',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso revertido',
  ADJUSTED: 'Ajuste',
} as const;

export type StatusType = keyof typeof ESTATUS_TYPES;