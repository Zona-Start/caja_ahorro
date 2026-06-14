export const PARTNER_EVENTS = {
  ASSOCIATE_CREATED: 'associate.created',
  ASSOCIATE_STATUS_CHANGED: 'associate.status.changed',
  ACCOUNT_MOVEMENT_CREATED: 'associate.account.movement.created',
  WITHDRAWAL_REQUESTED: 'withdrawal.requested',
  WITHDRAWAL_COMPLETED: 'withdrawal.completed',
  SETTLEMENT_CREATED: 'settlement.created',
  SETTLEMENT_COMPLETED: 'settlement.completed',
} as const;

export interface AssociateCreatedEvent {
  tenantId: string;
  associateId: string;
  fullname: string;
  email?: string;
  phone?: string;
  timestamp: string;
}

export interface AssociateStatusChangedEvent {
  tenantId: string;
  associateId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface AssociateAccountMovementCreatedEvent {
  tenantId: string;
  movementId: string;
  associateAccountId: string;
  associateId: string;
  movementType: string;
  amount: number;
  referenceId?: string;
  referenceType?: string;
  timestamp: string;
}

export interface WithdrawalRequestedEvent {
  tenantId: string;
  withdrawalId: string;
  associateId: string;
  amount: number;
  timestamp: string;
}

export interface WithdrawalCompletedEvent {
  tenantId: string;
  withdrawalId: string;
  associateId: string;
  amount: number;
  timestamp: string;
}

export interface SettlementCreatedEvent {
  tenantId: string;
  settlementId: string;
  associateId: string;
  totalAmount: number;
  timestamp: string;
}

export interface SettlementCompletedEvent {
  tenantId: string;
  settlementId: string;
  associateId: string;
  totalAmount: number;
  timestamp: string;
}
