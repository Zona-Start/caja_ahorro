import {
  bankAccounts,
  bankCategoryRule,
  bankDirectory,
  bankReconciliationDetails,
  bankReconciliations,
  bankTransactions,
  internalTransactionBankLinks,
} from '../schema/tables/treasury';

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;

export type BankCategoryRule = typeof bankCategoryRule.$inferSelect;
export type NewBankCategoryRule = typeof bankCategoryRule.$inferInsert;

export type BankDirectory = typeof bankDirectory.$inferSelect;
export type NewBankDirectory = typeof bankDirectory.$inferInsert;

export type BankReconciliationDetail =
  typeof bankReconciliationDetails.$inferSelect;
export type NewBankReconciliationDetail =
  typeof bankReconciliationDetails.$inferInsert;

export type BankReconciliation = typeof bankReconciliations.$inferSelect;
export type NewBankReconciliation = typeof bankReconciliations.$inferInsert;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type NewBankTransaction = typeof bankTransactions.$inferInsert;

export type InternalTransactionBankLink =
  typeof internalTransactionBankLinks.$inferSelect;
export type NewInternalTransactionBankLink =
  typeof internalTransactionBankLinks.$inferInsert;
