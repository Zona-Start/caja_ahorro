import { z } from 'zod';
import { currencySchema } from './currencies.schema';

export const currencyResponseSchema = currencySchema;
export const currenciesListResponseSchema = z.array(currencySchema);
export const currencyDeleteResponseSchema = z.object({
  message: z.string(),
});