import { z } from 'zod';

export const BalanceSchema = z.object({
  accountCode: z.string().min(1),
  descripcion: z.string().min(1),
  balance: z.coerce.number(),
});

export const InitialLoadSchema = z.object({
  balances: z.array(BalanceSchema).optional(),
});

export type InitialLoadDto = z.infer<typeof InitialLoadSchema>;
