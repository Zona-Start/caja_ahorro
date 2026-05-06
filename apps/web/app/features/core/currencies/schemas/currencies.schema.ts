import { z } from 'zod';

export const currencySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  isBase: z.boolean().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  decimalPlaces: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  createdById: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
});

export const currencyMutationSchema = z.object({
  id: z.string().optional(),
  code: z.enum(['VES', 'USD', 'EUR']),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  symbol: z.string().min(1, 'El símbolo es requerido').max(5),
  isBase: z.boolean().optional(),
  isActive: z.boolean().optional(),
  decimalPlaces: z.number().min(0).optional(),
});

export type Currency = z.infer<typeof currencySchema>;
export type CurrencyMutation = z.infer<typeof currencyMutationSchema>;