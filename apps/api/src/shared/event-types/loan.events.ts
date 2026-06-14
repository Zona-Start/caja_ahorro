export const LOAN_EVENTS = {
  LOAN_REQUESTED: 'loan.requested',
  LOAN_APPROVED: 'loan.approved',
  LOAN_DISBURSED: 'loan.disbursed',
  LOAN_STATUS_CHANGED: 'loan.status.changed',
  LOAN_CANCELLED: 'loan.cancelled',
  PAYMENT_CREATED: 'loan.payment.created',
  PAYMENT_CANCELLED: 'loan.payment.cancelled',
  PAYMENT_COMPLETED: 'loan.payment.completed',
} as const;

export interface LoanRequestedEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  amount: number;
  loanTypeId: string;
  timestamp: string;
}

export interface LoanApprovedEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  approvedAmount: number;
  approvedById: string;
  timestamp: string;
}

export interface LoanDisbursedEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  amount: number;
  disbursementDate: string;
  timestamp: string;
}

export interface LoanStatusChangedEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface LoanCancelledEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  timestamp: string;
}

export interface LoanPaymentCreatedEvent {
  tenantId: string;
  paymentId: string;
  loanId: string;
  associateId: string;
  amount: number;
  paymentMethod: string;
  customReference: string;
  timestamp: string;
}

export interface LoanPaymentCancelledEvent {
  tenantId: string;
  paymentId: string;
  loanId: string;
  associateId: string;
  amount: number;
  customReference: string;
  timestamp: string;
}

export interface LoanPaymentCompletedEvent {
  tenantId: string;
  loanId: string;
  associateId: string;
  timestamp: string;
}
