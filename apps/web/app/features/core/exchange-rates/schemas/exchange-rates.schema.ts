import { z } from 'zod';

export const manualRateSchema = z.object({
  currencyCode: z.enum(['USD', 'EUR']),
  rate: z.coerce
    .number()
    .positive('La tasa debe ser un número positivo.')
    .max(999999.999999),
  rateDate: z.coerce.date().optional(),
});

export type ManualRateInput = z.infer<typeof manualRateSchema>;

export const latestRateSchema = z.object({
  rate: z.string().nullable(),
  rateDate: z.string().nullable(),
});

export type LatestRate = z.infer<typeof latestRateSchema>;

export const exchangeRateSchema = z.object({
  id: z.string(),
  currencyCode: z.string(),
  currencyName: z.string().nullable().optional(),
  rate: z.string(),
  rateDate: z.string(),
  source: z.string().nullable().optional(),
  isAutomatic: z.boolean().nullable().optional(),
  fetchedAt: z.string().nullable().optional(),
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

export const exchangeRatesPageSchema = z.object({
  data: z.array(exchangeRateSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type ExchangeRatesPage = z.infer<typeof exchangeRatesPageSchema>;

export const syncBcvResponseSchema = z.object({
  message: z.string().optional(),
  rateDate: z.string(),
  dates: z.array(z.string()).optional(),
  rates: z.object({
    USD: z.string(),
    EUR: z.string(),
  }),
  currencies: z.array(z.string()).optional(),
});

export type SyncBcvResponse = z.infer<typeof syncBcvResponseSchema>;
