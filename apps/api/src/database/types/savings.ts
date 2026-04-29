import {
  associateAccountBalanceHistory,
  associateAccountMovements,
  associateAccounts,
  associates,
  creditAmortizationSchedule,
  creditItemSales,
  creditPayments,
  creditPaymentsDetails,
  creditStatusHistory,
  credits,
  creditsTypes,
  liquidationsAssociates,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loanStatusHistory,
  loanTypes,
  loans,
  paymentBatchItems,
  paymentBatches,
  withdrawalTypes,
  withdrawalsAssociates,
} from '../schema/tables/savings';

// Asociados y Cuentas
export type AssociateAccountBalanceHistory =
  typeof associateAccountBalanceHistory.$inferSelect;
export type NewAssociateAccountBalanceHistory =
  typeof associateAccountBalanceHistory.$inferInsert;

export type AssociateAccountMovement =
  typeof associateAccountMovements.$inferSelect;
export type NewAssociateAccountMovement =
  typeof associateAccountMovements.$inferInsert;

export type AssociateAccount = typeof associateAccounts.$inferSelect;
export type NewAssociateAccount = typeof associateAccounts.$inferInsert;

export type Associate = typeof associates.$inferSelect;
export type NewAssociate = typeof associates.$inferInsert;

// Créditos
export type CreditAmortizationSchedule =
  typeof creditAmortizationSchedule.$inferSelect;
export type NewCreditAmortizationSchedule =
  typeof creditAmortizationSchedule.$inferInsert;

export type CreditItemSale = typeof creditItemSales.$inferSelect;
export type NewCreditItemSale = typeof creditItemSales.$inferInsert;

export type CreditPayment = typeof creditPayments.$inferSelect;
export type NewCreditPayment = typeof creditPayments.$inferInsert;

export type CreditPaymentDetail = typeof creditPaymentsDetails.$inferSelect;
export type NewCreditPaymentDetail = typeof creditPaymentsDetails.$inferInsert;

export type CreditStatusHistory = typeof creditStatusHistory.$inferSelect;
export type NewCreditStatusHistory = typeof creditStatusHistory.$inferInsert;

export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;

export type CreditType = typeof creditsTypes.$inferSelect;
export type NewCreditType = typeof creditsTypes.$inferInsert;

// Préstamos (Loans)
export type LoanAmortizationSchedule =
  typeof loanAmortizationSchedule.$inferSelect;
export type NewLoanAmortizationSchedule =
  typeof loanAmortizationSchedule.$inferInsert;

export type LoanPayment = typeof loanPayments.$inferSelect;
export type NewLoanPayment = typeof loanPayments.$inferInsert;

export type LoanPaymentDetail = typeof loanPaymentsDetails.$inferSelect;
export type NewLoanPaymentDetail = typeof loanPaymentsDetails.$inferInsert;

export type LoanStatusHistory = typeof loanStatusHistory.$inferSelect;
export type NewLoanStatusHistory = typeof loanStatusHistory.$inferInsert;

export type LoanType = typeof loanTypes.$inferSelect;
export type NewLoanType = typeof loanTypes.$inferInsert;

export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

// Liquidaciones y Retiros
export type LiquidationAssociate = typeof liquidationsAssociates.$inferSelect;
export type NewLiquidationAssociate =
  typeof liquidationsAssociates.$inferInsert;

export type WithdrawalType = typeof withdrawalTypes.$inferSelect;
export type NewWithdrawalType = typeof withdrawalTypes.$inferInsert;

export type WithdrawalAssociate = typeof withdrawalsAssociates.$inferSelect;
export type NewWithdrawalAssociate = typeof withdrawalsAssociates.$inferInsert;

// Lotes de Pago
export type PaymentBatchItem = typeof paymentBatchItems.$inferSelect;
export type NewPaymentBatchItem = typeof paymentBatchItems.$inferInsert;

export type PaymentBatch = typeof paymentBatches.$inferSelect;
export type NewPaymentBatch = typeof paymentBatches.$inferInsert;
