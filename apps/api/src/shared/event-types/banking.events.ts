export const BANKING_EVENTS = {
  ACCOUNT_CREATED: 'bank.account.created',
  ACCOUNT_BALANCE_CHANGED: 'bank.account.balance.changed',
  MOVEMENT_CREATED: 'bank.movement.created',
  MOVEMENT_REVERSED: 'bank.movement.reversed',
  MOVEMENT_RECONCILED: 'bank.movement.reconciled',
  RECONCILIATION_COMPLETED: 'bank.reconciliation.completed',
} as const;

export interface BankingAccountCreatedEvent {
  tenantId: string;
  bankAccountId: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  timestamp: string;
}

export interface BankingAccountBalanceChangedEvent {
  tenantId: string;
  bankAccountId: string;
  accountNumber: string;
  previousBalance: number;
  newBalance: number;
  timestamp: string;
}

export interface BankingMovementCreatedEvent {
  tenantId: string;
  movementId: string;
  bankAccountId: string;
  transactionDate: string;
  description: string;
  creditAmount: number;
  debitAmount: number;
  category: string;
  internalRecordType?: string;
  internalRecordId?: string;
  timestamp: string;
}

export interface BankingMovementReversedEvent {
  tenantId: string;
  movementId: string;
  originalMovementId: string;
  bankAccountId: string;
  timestamp: string;
}

export interface BankingMovementReconciledEvent {
  tenantId: string;
  movementId: string;
  bankAccountId: string;
  internalRecordType: string;
  internalRecordId: string;
  timestamp: string;
}

export interface BankingReconciliationCompletedEvent {
  tenantId: string;
  reconciliationId: string;
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  timestamp: string;
}
