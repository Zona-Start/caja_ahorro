export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro método',
  MOBILE_PAYMENT: 'Pago móvil',
} as const;

export const BANK_TRANSACTION_CATEGORY = {
  OPENING_BANK: 'Saldo Inicial Bancario', // Saldo inicial al abrir la cuenta BANCARIA
  INITIAL_ADJUSTMENT_BANK: 'Ajuste inicial al abrir la cuenta BANCARIA', // Ajuste inicial al abrir la cuenta BANCARIA
  CLOSING: 'CLOSING', // Saldo final al cerrar la cuenta
  DEPOSIT: 'DEPOSIT', // Ejemplo: Depósitos en efectivo, transferencias entrantes
  WITHDRAWAL: 'WITHDRAWAL', // Ejemplo: Retiros en efectivo, transferencias salientes
  MEMBER_DUES: 'Aportes al Asociado',
  LOAN_DISABURSEMENT: 'Desembolso de Préstamo',
  LOAN_PAYMENT: 'Pago de Préstamo',
  MEMBER_WITHDRAWAL: 'Retiro de Asociado',
  ADMINISTRATIVE_EXPENSES: 'Gastos Administrativos',
  BANK_FEES: 'Comisiones Bancarias',
  INTEREST_EARNED: 'Intereses Ganados',
  TAXES: 'Impuestos',
  OTHER_INCOME: 'Otros Ingresos',
  OTHER_EXPENSES: 'Otros Gastos',
  INTERNAL_TRANSFER: 'Transferencia Interna',
} as const;

export const INTERNAL_LINK_STATUS = {
  LINKED: 'Vinculado',
  UNLINKED: 'No Vinculado',
  PARTIALLY_LINKED: 'Parcialmente Vinculado',
  NOT_APPLICABLE: 'No Aplica',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type BankTransactionCategory = keyof typeof BANK_TRANSACTION_CATEGORY;
export type InternalLinkStatus = keyof typeof INTERNAL_LINK_STATUS;
