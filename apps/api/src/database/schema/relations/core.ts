import { relations } from 'drizzle-orm';
import {
  categories,
  currencies,
  exchangeRates,
  localities,
  municipalities,
  parishes,
  states,
} from '../tables/core';
import { tenants } from '../tables/tenants';

export const currenciesRelations = relations(currencies, ({ many }) => ({
  exchangeRates: many(exchangeRates),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRates.currencyId],
    references: [currencies.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  tenants: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
}));

export const statesRelations = relations(states, ({ many }) => ({
  municipalities: many(municipalities),
  localities: many(localities),
}));

export const municipalitiesRelations = relations(
  municipalities,
  ({ one, many }) => ({
    state: one(states, {
      fields: [municipalities.stateId],
      references: [states.id],
    }),
    parishes: many(parishes),
    localities: many(localities),
  }),
);

export const parishesRelations = relations(parishes, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [parishes.municipalityId],
    references: [municipalities.id],
  }),
  localities: many(localities),
}));

export const localitiesRelations = relations(localities, ({ one }) => ({
  state: one(states, {
    fields: [localities.stateId],
    references: [states.id],
  }),
  municipality: one(municipalities, {
    fields: [localities.municipalityId],
    references: [municipalities.id],
  }),
  parish: one(parishes, {
    fields: [localities.parishId],
    references: [parishes.id],
  }),
}));
