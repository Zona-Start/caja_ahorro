import {
  accountBalances,
  accountPlan,
  accountingCycles,
  accountingEntries,
  accountingEntryDetails,
  accountingRuleDetails,
  accountingRules,
} from '../schema/tables/accounting';

export type AccountBalance = typeof accountBalances.$inferSelect;
export type NewAccountBalance = typeof accountBalances.$inferInsert;

export type AccountPlan = typeof accountPlan.$inferSelect;
export type NewAccountPlan = typeof accountPlan.$inferInsert;

export type AccountingCycle = typeof accountingCycles.$inferSelect;
export type NewAccountingCycle = typeof accountingCycles.$inferInsert;

export type AccountingEntry = typeof accountingEntries.$inferSelect;
export type NewAccountingEntry = typeof accountingEntries.$inferInsert;

export type AccountingEntryDetail = typeof accountingEntryDetails.$inferSelect;
export type NewAccountingEntryDetail =
  typeof accountingEntryDetails.$inferInsert;

export type AccountingEntryWithDetails = AccountingEntry & {
  details: AccountingEntryDetail[];
};

export type AccountingRuleDetail = typeof accountingRuleDetails.$inferSelect;
export type NewAccountingRuleDetail = typeof accountingRuleDetails.$inferInsert;

export type AccountingRule = typeof accountingRules.$inferSelect;
export type NewAccountingRule = typeof accountingRules.$inferInsert;

export type AccountingRuleWithDetails = AccountingRule & {
  details: AccountingRuleDetail[];
};
