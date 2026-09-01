import { z } from 'zod';

export const BalanceSchema = z.object({
  accountCode: z.string().min(1),
  descripcion: z.string().min(1),
  auxiliarSocio: z.string().optional().nullable(),
  auxiliarProveedor: z.string().optional().nullable(),
  debe: z.coerce.number().optional(),
  haber: z.coerce.number().optional(),
  balance: z.coerce.number().optional(),
});

export const InitialLoadSchema = z.object({
  balances: z.array(BalanceSchema).optional(),
});

export type InitialLoadDto = z.infer<typeof InitialLoadSchema>;
