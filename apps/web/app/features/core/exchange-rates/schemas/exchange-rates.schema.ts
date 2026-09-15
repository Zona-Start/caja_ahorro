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
