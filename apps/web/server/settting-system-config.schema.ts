import { z } from 'zod';

export enum CurrencyCodeEnum {
  VES = 'VES',
  USD = 'USD',
}

export const currenciesSchema = z.object({
  id: z.number(),
  code: z.enum(
    Object.values(CurrencyCodeEnum) as [
      CurrencyCodeEnum,
      ...CurrencyCodeEnum[],
    ],
  ),
  name: z.string(),
  symbol: z.string(),
  decimalPlaces: z.number(),
  isActive: z.boolean(),
});

export const settingSystemSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
  description: z.string(),
  group: z.string(),
});

export const exchngesRateSchema = z.object({
  id: z.number(),
  date: z.string(),
  fromCurrencyCode: z.enum(
    Object.values(CurrencyCodeEnum) as [
      CurrencyCodeEnum,
      ...CurrencyCodeEnum[],
    ],
  ),
  toCurrencyCode: z.enum(
    Object.values(CurrencyCodeEnum) as [
      CurrencyCodeEnum,
      ...CurrencyCodeEnum[],
    ],
  ),
  rate: z.number(),
  source: z.string(),
});

export const currenciesAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(currenciesSchema),
});

export const settingSystemAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(settingSystemSchema),
});

export const exchangeRateAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(exchngesRateSchema),
});
