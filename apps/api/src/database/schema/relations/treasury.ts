import { relations } from 'drizzle-orm';
import {
  accountPlan,
  accountingEntries,
  accountingEntryDetails,
} from '../tables/accounting';
import { users } from '../tables/auth';
import { tenants } from '../tables/tenants';
import {
  bankAccounts,
  bankCategoryRule,
  bankDirectory,
  bankReconciliationDetails,
  bankReconciliations,
  bankTransactions,
  internalTransactionBankLinks,
} from '../tables/treasury';

export const bankDirectoryRelations = relations(bankDirectory, ({ many }) => ({
  bankAccounts: many(bankAccounts),
}));

export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [bankAccounts.tenantId],
      references: [tenants.id],
    }),
    bankDirectory: one(bankDirectory, {
      fields: [bankAccounts.bankDirectoryId],
      references: [bankDirectory.id],
    }),
    linkedChartAccount: one(accountPlan, {
      fields: [bankAccounts.linkedChartAccountId],
      references: [accountPlan.id],
    }),
    transactions: many(bankTransactions),
    reconciliations: many(bankReconciliations),
  }),
);

export const bankTransactionsRelations = relations(
  bankTransactions,
  ({ one, many }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankTransactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    categoryRule: one(bankCategoryRule, {
      fields: [bankTransactions.category],
      references: [bankCategoryRule.id],
    }),
    reconciliation: one(bankReconciliations, {
      fields: [bankTransactions.bankReconciliationId],
      references: [bankReconciliations.id],
    }),
    internalLink: one(internalTransactionBankLinks, {
      fields: [bankTransactions.id],
      references: [internalTransactionBankLinks.bankTransactionId],
    }),
  }),
);

export const internalTransactionBankLinksRelations = relations(
  internalTransactionBankLinks,
  ({ one }) => ({
    bankTransaction: one(bankTransactions, {
      fields: [internalTransactionBankLinks.bankTransactionId],
      references: [bankTransactions.id],
    }),
    linkedByUser: one(users, {
      fields: [internalTransactionBankLinks.linkedBy],
      references: [users.id],
    }),
  }),
);

export const bankCategoryRuleRelations = relations(
  bankCategoryRule,
  ({ one, many }) => ({
    defaultDebitAccount: one(accountPlan, {
      fields: [bankCategoryRule.defaultDebitAccountId],
      references: [accountPlan.id],
      relationName: 'debitRuleAccount',
    }),
    defaultCreditAccount: one(accountPlan, {
      fields: [bankCategoryRule.defaultCreditAccountId],
      references: [accountPlan.id],
      relationName: 'creditRuleAccount',
    }),
    transactions: many(bankTransactions),
  }),
);

export const bankReconciliationsRelations = relations(
  bankReconciliations,
  ({ one, many }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankReconciliations.bankAccountId],
      references: [bankAccounts.id],
    }),
    preparedByUser: one(users, {
      fields: [bankReconciliations.preparedByUserId],
      references: [users.id],
      relationName: 'preparedByUser',
    }),
    reviewedByUser: one(users, {
      fields: [bankReconciliations.reviewedByUserId],
      references: [users.id],
      relationName: 'reviewedByUser',
    }),
    details: many(bankReconciliationDetails),
    transactions: many(bankTransactions),
  }),
);

export const bankReconciliationDetailsRelations = relations(
  bankReconciliationDetails,
  ({ one }) => ({
    reconciliation: one(bankReconciliations, {
      fields: [bankReconciliationDetails.bankReconciliationId],
      references: [bankReconciliations.id],
    }),
    bankTransaction: one(bankTransactions, {
      fields: [bankReconciliationDetails.bankTransactionId],
      references: [bankTransactions.id],
    }),
    accountingEntryDetail: one(accountingEntryDetails, {
      fields: [bankReconciliationDetails.accountingEntryDetailId],
      references: [accountingEntryDetails.id],
    }),
    adjustmentEntry: one(accountingEntries, {
      fields: [bankReconciliationDetails.adjustmentEntryId],
      references: [accountingEntries.id],
    }),
  }),
);
