import { relations } from 'drizzle-orm';
import {
  associateAccountBalanceHistory,
  associateAccountMovements,
  associateAccounts,
  associates,
  contributionBatches,
  contributionBatchAssociates,
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
} from '../tables/savings';
import { tenants } from '../tables/tenants';
import { states, categories, exchangeRates } from '../tables/core';
import { bankAccounts, bankDirectory, bankTransactions } from '../tables/treasury';
import { accountPlan, accountingEntries } from '../tables/accounting';
import { users } from '../tables/auth';
import { suppliers } from '../tables/purchasing';

export const associatesRelations = relations(associates, ({ one, many }) => ({
  tenants: one(tenants, {
    fields: [associates.tenantId],
    references: [tenants.id],
  }),
  locality: one(states, {
    fields: [associates.localityId],
    references: [states.id],
  }),
  payrollType: one(categories, {
    fields: [associates.payrollTypeId],
    references: [categories.id],
  }),
  associatedType: one(categories, {
    fields: [associates.associatedTypeId],
    references: [categories.id],
  }),
  accounts: many(associateAccounts),
  loans: many(loans),
  credits: many(credits),
  liquidations: many(liquidationsAssociates),
}));

export const associateAccountsRelations = relations(
  associateAccounts,
  ({ one, many }) => ({
    associate: one(associates, {
      fields: [associateAccounts.associateId],
      references: [associates.id],
    }),
    bank: one(bankDirectory, {
      fields: [associateAccounts.bankDirectoryId],
      references: [bankDirectory.id],
    }),
    movements: many(associateAccountMovements),
    balanceHistory: many(associateAccountBalanceHistory),
    withdrawals: many(withdrawalsAssociates),
    loanDisbursements: many(loans),
  }),
);

export const associateAccountMovementsRelations = relations(
  associateAccountMovements,
  ({ one, many }) => ({
    account: one(associateAccounts, {
      fields: [associateAccountMovements.associateAccountId],
      references: [associateAccounts.id],
    }),
    exchangeRate: one(exchangeRates, {
      fields: [associateAccountMovements.exchangeRateId],
      references: [exchangeRates.id],
    }),
    balanceHistory: many(associateAccountBalanceHistory),
  }),
);

export const associateAccountBalanceHistoryRelations = relations(
  associateAccountBalanceHistory,
  ({ one }) => ({
    account: one(associateAccounts, {
      fields: [associateAccountBalanceHistory.associateAccountId],
      references: [associateAccounts.id],
    }),
    movement: one(associateAccountMovements, {
      fields: [associateAccountBalanceHistory.movementId],
      references: [associateAccountMovements.id],
    }),
  }),
);

export const withdrawalTypesRelations = relations(
  withdrawalTypes,
  ({ one, many }) => ({
    debitAccount: one(accountPlan, {
      fields: [withdrawalTypes.accountDebit],
      references: [accountPlan.id],
      relationName: 'withdrawalDebitAccount',
    }),
    expenseAccount: one(accountPlan, {
      fields: [withdrawalTypes.expenseAccount],
      references: [accountPlan.id],
      relationName: 'withdrawalExpenseAccount',
    }),
    frequencyCategory: one(categories, {
      fields: [withdrawalTypes.withdrawalFrequencyRelation],
      references: [categories.id],
    }),
    withdrawals: many(withdrawalsAssociates),
  }),
);

export const withdrawalsAssociatesRelations = relations(
  withdrawalsAssociates,
  ({ one }) => ({
    account: one(associateAccounts, {
      fields: [withdrawalsAssociates.associateAccountId],
      references: [associateAccounts.id],
    }),
    withdrawalType: one(withdrawalTypes, {
      fields: [withdrawalsAssociates.withdrawalTypeId],
      references: [withdrawalTypes.id],
    }),
    commercialHouse: one(suppliers, {
      fields: [withdrawalsAssociates.commercialHouseId],
      references: [suppliers.id],
    }),
  }),
);

export const loanTypesRelations = relations(loanTypes, ({ one, many }) => ({
  loanAccount: one(accountPlan, {
    fields: [loanTypes.loanAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeLoanAccount',
  }),
  interestAccount: one(accountPlan, {
    fields: [loanTypes.interestEarnedAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeInterestAccount',
  }),
  specialQuotaAccount: one(accountPlan, {
    fields: [loanTypes.specialQuotaAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeSpecialQuotaAccount',
  }),
  expenseAccount: one(accountPlan, {
    fields: [loanTypes.expenseAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeExpenseAccount',
  }),
  payrollType: one(categories, {
    fields: [loanTypes.payrollTypeId],
    references: [categories.id],
  }),
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  associate: one(associates, {
    fields: [loans.associateId],
    references: [associates.id],
  }),
  tenants: one(tenants, {
    fields: [loans.tenantId],
    references: [tenants.id],
  }),
  loanType: one(loanTypes, {
    fields: [loans.loanTypeId],
    references: [loanTypes.id],
  }),
  previousLoan: one(loans, {
    fields: [loans.previousLoanId],
    references: [loans.id],
    relationName: 'previousLoanRelation',
  }),
  disbursementAccount: one(associateAccounts, {
    fields: [loans.disbursementAccountId],
    references: [associateAccounts.id],
  }),
  approvedByUser: one(users, {
    fields: [loans.approvedByUserId],
    references: [users.id],
    relationName: 'loanApprovedByUser',
  }),
  disbursedByUser: one(users, {
    fields: [loans.disbursedByUserId],
    references: [users.id],
    relationName: 'loanDisbursedByUser',
  }),
  exchangeRate: one(exchangeRates, {
    fields: [loans.exchangeRateId],
    references: [exchangeRates.id],
  }),
  amortizationSchedule: many(loanAmortizationSchedule),
  statusHistory: many(loanStatusHistory),
  payments: many(loanPayments),
}));

export const loanAmortizationScheduleRelations = relations(
  loanAmortizationSchedule,
  ({ one, many }) => ({
    loan: one(loans, {
      fields: [loanAmortizationSchedule.loanId],
      references: [loans.id],
    }),
    paymentDetails: many(loanPaymentsDetails),
  }),
);

export const loanStatusHistoryRelations = relations(
  loanStatusHistory,
  ({ one }) => ({
    loan: one(loans, {
      fields: [loanStatusHistory.loanId],
      references: [loans.id],
    }),
    changedByUser: one(users, {
      fields: [loanStatusHistory.changedByUserId],
      references: [users.id],
    }),
  }),
);

export const loanPaymentsRelations = relations(
  loanPayments,
  ({ one, many }) => ({
    loan: one(loans, {
      fields: [loanPayments.loanId],
      references: [loans.id],
    }),
    bank: one(bankAccounts, {
      fields: [loanPayments.bankId],
      references: [bankAccounts.id],
    }),
    details: many(loanPaymentsDetails),
  }),
);

export const loanPaymentsDetailsRelations = relations(
  loanPaymentsDetails,
  ({ one }) => ({
    payment: one(loanPayments, {
      fields: [loanPaymentsDetails.loanPaymentId],
      references: [loanPayments.id],
    }),
    installment: one(loanAmortizationSchedule, {
      fields: [loanPaymentsDetails.installmentId],
      references: [loanAmortizationSchedule.id],
    }),
  }),
);

export const creditsTypesRelations = relations(
  creditsTypes,
  ({ one, many }) => ({
    creditAccount: one(accountPlan, {
      fields: [creditsTypes.creditAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeCreditAccount',
    }),
    interestAccount: one(accountPlan, {
      fields: [creditsTypes.interestEarnedAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeInterestAccount',
    }),
    specialQuotaAccount: one(accountPlan, {
      fields: [creditsTypes.specialQuotaAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeSpecialQuotaAccount',
    }),
    expenseAccount: one(accountPlan, {
      fields: [creditsTypes.expenseAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeExpenseAccount',
    }),
    payrollType: one(categories, {
      fields: [creditsTypes.payrollTypeId],
      references: [categories.id],
    }),
    credits: many(credits),
  }),
);

export const creditsRelations = relations(credits, ({ one, many }) => ({
  associate: one(associates, {
    fields: [credits.associateId],
    references: [associates.id],
  }),
  tenants: one(tenants, {
    fields: [credits.tenantId],
    references: [tenants.id],
  }),
  creditType: one(creditsTypes, {
    fields: [credits.creditTypeId],
    references: [creditsTypes.id],
  }),
  previousCredit: one(credits, {
    fields: [credits.previousCreditId],
    references: [credits.id],
    relationName: 'previousCreditRelation',
  }),
  approvedByUser: one(users, {
    fields: [credits.approvedByUserId],
    references: [users.id],
    relationName: 'creditApprovedByUser',
  }),
  exchangeRate: one(exchangeRates, {
    fields: [credits.exchangeRateId],
    references: [exchangeRates.id],
  }),
  amortizationSchedule: many(creditAmortizationSchedule),
  statusHistory: many(creditStatusHistory),
  payments: many(creditPayments),
  itemSales: many(creditItemSales),
}));

export const creditAmortizationScheduleRelations = relations(
  creditAmortizationSchedule,
  ({ one, many }) => ({
    credit: one(credits, {
      fields: [creditAmortizationSchedule.creditId],
      references: [credits.id],
    }),
    paymentDetails: many(creditPaymentsDetails),
  }),
);

export const creditStatusHistoryRelations = relations(
  creditStatusHistory,
  ({ one }) => ({
    credit: one(credits, {
      fields: [creditStatusHistory.creditId],
      references: [credits.id],
    }),
    changedByUser: one(users, {
      fields: [creditStatusHistory.changedByUserId],
      references: [users.id],
    }),
  }),
);

export const creditPaymentsRelations = relations(
  creditPayments,
  ({ one, many }) => ({
    credit: one(credits, {
      fields: [creditPayments.creditId],
      references: [credits.id],
    }),
    bank: one(bankDirectory, {
      fields: [creditPayments.bankId],
      references: [bankDirectory.id],
    }),
    details: many(creditPaymentsDetails),
  }),
);

export const creditPaymentsDetailsRelations = relations(
  creditPaymentsDetails,
  ({ one }) => ({
    payment: one(creditPayments, {
      fields: [creditPaymentsDetails.creditPaymentId],
      references: [creditPayments.id],
    }),
    installment: one(creditAmortizationSchedule, {
      fields: [creditPaymentsDetails.installmentId],
      references: [creditAmortizationSchedule.id],
    }),
  }),
);

export const liquidationsAssociatesRelations = relations(
  liquidationsAssociates,
  ({ one }) => ({
    associate: one(associates, {
      fields: [liquidationsAssociates.associateId],
      references: [associates.id],
    }),
  }),
);

export const creditItemSalesRelations = relations(
  creditItemSales,
  ({ one }) => ({
    credit: one(credits, {
      fields: [creditItemSales.creditId],
      references: [credits.id],
    }),
    days: one(categories, {
      fields: [creditItemSales.days],
      references: [categories.id],
    }),
  }),
);

export const paymentBatchesRelations = relations(
  paymentBatches,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [paymentBatches.tenantId],
      references: [tenants.id],
    }),
    bank: one(bankDirectory, {
      fields: [paymentBatches.bankId],
      references: [bankDirectory.id],
    }),
    items: many(paymentBatchItems),
  }),
);

export const paymentBatchItemsRelations = relations(
  paymentBatchItems,
  ({ one }) => ({
    batch: one(paymentBatches, {
      fields: [paymentBatchItems.paymentBatchId],
      references: [paymentBatches.id],
    }),
    associateAccount: one(associateAccounts, {
      fields: [paymentBatchItems.associateAccountId],
      references: [associateAccounts.id],
    }),
  }),
);

export const contributionBatchesRelations = relations(
  contributionBatches,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [contributionBatches.tenantId],
      references: [tenants.id],
    }),
    associate: one(associates, {
      fields: [contributionBatches.associateId],
      references: [associates.id],
    }),
    accountingEntry: one(accountingEntries, {
      fields: [contributionBatches.accountingEntryId],
      references: [accountingEntries.id],
      relationName: 'contribution_batches_accounting_entry',
    }),
    bankTransaction: one(bankTransactions, {
      fields: [contributionBatches.bankTransactionId],
      references: [bankTransactions.id],
    }),
    reversalEntry: one(accountingEntries, {
      fields: [contributionBatches.reversalEntryId],
      references: [accountingEntries.id],
      relationName: 'contribution_batches_reversal_entry',
    }),
    associates: many(contributionBatchAssociates),
  }),
);

export const contributionBatchAssociatesRelations = relations(
  contributionBatchAssociates,
  ({ one }) => ({
    batch: one(contributionBatches, {
      fields: [contributionBatchAssociates.contributionBatchId],
      references: [contributionBatches.id],
    }),
    associate: one(associates, {
      fields: [contributionBatchAssociates.associateId],
      references: [associates.id],
    }),
  }),
);
