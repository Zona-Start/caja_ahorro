import { relations } from 'drizzle-orm';
import { tenants, tenantSettings } from '../tables/tenants';
import { currencies, exchangeRates, categories, states, municipalities, parishes, localities } from '../tables/core';
import { accountPlan } from '../tables/accounting';

export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantSettings: many(tenantSettings),
  currencies: many(currencies),
  exchangeRates: many(exchangeRates),
  categories: many(categories),
  states: many(states),
  municipalities: many(municipalities),
  parishes: many(parishes),
  localities: many(localities),
  accountPlans: many(accountPlan),
}));

export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantSettings.tenantId],
    references: [tenants.id],
  }),
}));
