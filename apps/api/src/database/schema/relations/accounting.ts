import { relations } from 'drizzle-orm';
import {
  accountBalances,
  accountingCycles,
  accountingEntries,
  accountingEntryDetails,
  accountingRuleDetails,
  accountingRules,
  accountPlan,
} from '../tables/accounting';
import { users } from '../tables/auth';
import { tenants } from '../tables/tenants';

export const accountPlanRelations = relations(accountPlan, ({ one, many }) => ({
  tenants: one(tenants, {
    fields: [accountPlan.tenantId],
    references: [tenants.id],
  }),
  parent: one(accountPlan, {
    fields: [accountPlan.parentAccountId],
    references: [accountPlan.id],
    relationName: 'subAccounts',
  }),
  subAccounts: many(accountPlan, {
    relationName: 'subAccounts',
  }),
  entryDetails: many(accountingEntryDetails),
}));

export const accountingCyclesRelations = relations(
  accountingCycles,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [accountingCycles.tenantId],
      references: [tenants.id],
    }),
    closedByUser: one(users, {
      fields: [accountingCycles.closedByUser_id],
      references: [users.id],
    }),
    entries: many(accountingEntries),
  }),
);

export const accountingEntriesRelations = relations(
  accountingEntries,
  ({ one, many }) => ({
    tenants: one(tenants, {
      fields: [accountingEntries.tenantId],
      references: [tenants.id],
    }),
    cycle: one(accountingCycles, {
      fields: [accountingEntries.accountingCycleId],
      references: [accountingCycles.id],
    }),
    details: many(accountingEntryDetails),
  }),
);

export const accountingEntryDetailsRelations = relations(
  accountingEntryDetails,
  ({ one }) => ({
    entry: one(accountingEntries, {
      fields: [accountingEntryDetails.accountingEntryId],
      references: [accountingEntries.id],
    }),
    account: one(accountPlan, {
      fields: [accountingEntryDetails.accountPlanId],
      references: [accountPlan.id],
    }),
  }),
);

export const accountingRulesRelations = relations(
  accountingRules,
  ({ many }) => ({
    details: many(accountingRuleDetails),
  }),
);

export const accountingRuleDetailsRelations = relations(
  accountingRuleDetails,
  ({ one }) => ({
    rule: one(accountingRules, {
      fields: [accountingRuleDetails.ruleId],
      references: [accountingRules.id],
    }),
    account: one(accountPlan, {
      fields: [accountingRuleDetails.accountPlanId],
      references: [accountPlan.id],
    }),
  }),
);

export const accountBalancesRelations = relations(
  accountBalances,
  ({ one }) => ({
    accountPlan: one(accountPlan, {
      fields: [accountBalances.accountPlanId],
      references: [accountPlan.id],
    }),
    accountingCycle: one(accountingCycles, {
      fields: [accountBalances.accountingCyclesId],
      references: [accountingCycles.id],
    }),
    tenants: one(tenants, {
      fields: [accountBalances.tenantId],
      references: [tenants.id],
    }),
  }),
);
