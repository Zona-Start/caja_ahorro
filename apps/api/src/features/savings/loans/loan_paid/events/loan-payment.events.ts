export const LOAN_PAYMENT_EVENTS = {
  CREATED: 'loan.payment.created',
  CANCELLED: 'loan.payment.cancelled',
  COMPLETED: 'loan.payment.completed',
} as const;

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
