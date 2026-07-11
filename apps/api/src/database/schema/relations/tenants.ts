import { relations } from 'drizzle-orm';
import { accountPlan } from '../tables/accounting';
import {
  categories,
  currencies,
  exchangeRates,
  localities,
  municipalities,
  parishes,
  states,
} from '../tables/core';
import {
  tenantModuleIntegrations,
  tenantModules,
  tenants,
  tenantSettings,
} from '../tables/tenants';

export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantSettings: many(tenantSettings),
  tenantModules: many(tenantModules),
  tenantModuleIntegrations: many(tenantModuleIntegrations),
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

export const tenantModulesRelations = relations(tenantModules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantModules.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantModuleIntegrationsRelations = relations(
  tenantModuleIntegrations,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tenantModuleIntegrations.tenantId],
      references: [tenants.id],
    }),
  }),
);
