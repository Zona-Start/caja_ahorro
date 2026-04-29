import {
  categories,
  currencies,
  exchangeRates,
  globalSettings,
  localities,
  municipalities,
  parishes,
  states,
} from '../schema/tables/core';

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;

export type Locality = typeof localities.$inferSelect;
export type NewLocality = typeof localities.$inferInsert;

export type Municipality = typeof municipalities.$inferSelect;
export type NewMunicipality = typeof municipalities.$inferInsert;

export type Parish = typeof parishes.$inferSelect;
export type NewParish = typeof parishes.$inferInsert;

export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;

export type GlobalSetting = typeof globalSettings.$inferSelect;
export type NewGlobalSetting = typeof globalSettings.$inferInsert;
