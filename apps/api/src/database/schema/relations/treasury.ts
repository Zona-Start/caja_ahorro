import { relations } from 'drizzle-orm';
import {
  accountPlan,
  accountingEntries,
  accountingEntryDetails,
} from '../tables/accounting';
import { users } from '../tables/auth';
import { suppliers } from '../tables/purchasing';
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
import {
  cashMovements,
  cashRegisterSessions,
  cashRegisters,
  costCenters,
  expenseCategories,
  expenseDetails,
  expenseReportItems,
  expenseReports,
  expenses,
  pettyCashFunds,
  pettyCashSettlements,
  pettyCashVouchers,
  recurringExpenseTemplates,
} from '../tables/treasury-expenses';

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

export const cashRegistersRelations = relations(cashRegisters, ({ many }) => ({
  sessions: many(cashRegisterSessions),
}));

export const cashRegisterSessionsRelations = relations(
  cashRegisterSessions,
  ({ one, many }) => ({
    cashRegister: one(cashRegisters, {
      fields: [cashRegisterSessions.cashRegisterId],
      references: [cashRegisters.id],
    }),
    openedByUser: one(users, {
      fields: [cashRegisterSessions.openedByUserId],
      references: [users.id],
      relationName: 'sessionOpenedByUser',
    }),
    closedByUser: one(users, {
      fields: [cashRegisterSessions.closedByUserId],
      references: [users.id],
      relationName: 'sessionClosedByUser',
    }),
    movements: many(cashMovements),
  }),
);

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  session: one(cashRegisterSessions, {
    fields: [cashMovements.sessionId],
    references: [cashRegisterSessions.id],
  }),
}));

export const costCentersRelations = relations(costCenters, ({ many }) => ({
  expenses: many(expenses),
}));

export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ many }) => ({
    expenses: many(expenses),
  }),
);

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [expenses.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [expenses.supplierId],
    references: [suppliers.id],
  }),
  costCenter: one(costCenters, {
    fields: [expenses.costCenterId],
    references: [costCenters.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  cashRegisterSession: one(cashRegisterSessions, {
    fields: [expenses.cashRegisterSessionId],
    references: [cashRegisterSessions.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [expenses.bankAccountId],
    references: [bankAccounts.id],
  }),
  pettyCashFund: one(pettyCashFunds, {
    fields: [expenses.pettyCashFundId],
    references: [pettyCashFunds.id],
  }),
  details: many(expenseDetails),
}));

export const pettyCashFundsRelations = relations(
  pettyCashFunds,
  ({ one, many }) => ({
    custodianUser: one(users, {
      fields: [pettyCashFunds.custodianUserId],
      references: [users.id],
      relationName: 'pettyCashCustodian',
    }),
    expenses: many(expenses),
    vouchers: many(pettyCashVouchers),
    settlements: many(pettyCashSettlements),
  }),
);

export const expenseDetailsRelations = relations(expenseDetails, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseDetails.expenseId],
    references: [expenses.id],
  }),
  category: one(expenseCategories, {
    fields: [expenseDetails.categoryId],
    references: [expenseCategories.id],
  }),
}));

export const pettyCashVouchersRelations = relations(
  pettyCashVouchers,
  ({ one }) => ({
    fund: one(pettyCashFunds, {
      fields: [pettyCashVouchers.fundId],
      references: [pettyCashFunds.id],
    }),
  }),
);

export const pettyCashSettlementsRelations = relations(
  pettyCashSettlements,
  ({ one }) => ({
    fund: one(pettyCashFunds, {
      fields: [pettyCashSettlements.fundId],
      references: [pettyCashFunds.id],
    }),
    closedByUser: one(users, {
      fields: [pettyCashSettlements.closedByUserId],
      references: [users.id],
      relationName: 'settlementClosedByUser',
    }),
  }),
);

export const recurringExpenseTemplatesRelations = relations(
  recurringExpenseTemplates,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [recurringExpenseTemplates.tenantId],
      references: [tenants.id],
    }),
    category: one(expenseCategories, {
      fields: [recurringExpenseTemplates.categoryId],
      references: [expenseCategories.id],
    }),
    supplier: one(suppliers, {
      fields: [recurringExpenseTemplates.supplierId],
      references: [suppliers.id],
    }),
    costCenter: one(costCenters, {
      fields: [recurringExpenseTemplates.costCenterId],
      references: [costCenters.id],
    }),
  }),
);

export const expenseReportsRelations = relations(
  expenseReports,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [expenseReports.tenantId],
      references: [tenants.id],
    }),
    employee: one(users, {
      fields: [expenseReports.employeeUserId],
      references: [users.id],
      relationName: 'reportEmployee',
    }),
    approver: one(users, {
      fields: [expenseReports.approvedByUserId],
      references: [users.id],
      relationName: 'reportApprover',
    }),
    bankAccount: one(bankAccounts, {
      fields: [expenseReports.bankAccountId],
      references: [bankAccounts.id],
    }),
    pettyCashFund: one(pettyCashFunds, {
      fields: [expenseReports.pettyCashFundId],
      references: [pettyCashFunds.id],
    }),
    items: many(expenseReportItems),
  }),
);

export const expenseReportItemsRelations = relations(
  expenseReportItems,
  ({ one }) => ({
    report: one(expenseReports, {
      fields: [expenseReportItems.reportId],
      references: [expenseReports.id],
    }),
    category: one(expenseCategories, {
      fields: [expenseReportItems.categoryId],
      references: [expenseCategories.id],
    }),
  }),
);
