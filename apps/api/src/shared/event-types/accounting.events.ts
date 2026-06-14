export const ACCOUNTING_EVENTS = {
  ENTRY_CREATED: 'accounting.entry.created',
  ENTRY_POSTED: 'accounting.entry.posted',
  ENTRY_CANCELLED: 'accounting.entry.cancelled',
  CYCLE_OPENED: 'accounting.cycle.opened',
  CYCLE_CLOSED: 'accounting.cycle.closed',
  BALANCE_UPDATED: 'accounting.balance.updated',
  RULE_CREATED: 'accounting.rule.created',
  RULE_UPDATED: 'accounting.rule.updated',
} as const;

export interface AccountingEntryCreatedEvent {
  tenantId: string;
  entryId: string;
  entryNumber: string;
  entryDate: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  originType?: string;
  originReferenceId?: string;
  timestamp: string;
}

export interface AccountingEntryPostedEvent {
  tenantId: string;
  entryId: string;
  entryNumber: string;
  postedById: string;
  timestamp: string;
}

export interface AccountingEntryCancelledEvent {
  tenantId: string;
  entryId: string;
  entryNumber: string;
  cancellationReason: string;
  timestamp: string;
}

export interface AccountingCycleOpenedEvent {
  tenantId: string;
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string;
  timestamp: string;
}

export interface AccountingCycleClosedEvent {
  tenantId: string;
  cycleId: string;
  name: string;
  closedById: string;
  timestamp: string;
}

export interface AccountingBalanceUpdatedEvent {
  tenantId: string;
  accountPlanId: string;
  cycleId: string;
  previousBalance: number;
  newBalance: number;
  timestamp: string;
}
