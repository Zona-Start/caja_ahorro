export const STATUS_TRANSACTIONS = {
  ACTIVE: 'Disponible',
  PARTIALLY_APPLIED: 'Parcial Aplicado',
  APPLIED: 'Aplicado',
  REVERSED: 'Reversado',
} as const;

export const STATUS_PAYMENT = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
} as const;

export type StatusTransactions = keyof typeof STATUS_TRANSACTIONS;
export type StatusPayment = keyof typeof STATUS_PAYMENT;
