import { z } from 'zod';

export const pettyCashFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del fondo es requerido')
    .max(100, 'Máximo 100 caracteres'),
  custodianUserId: z.string().uuid('El custodio es requerido'),
  assignedAmount: z.coerce
    .number()
    .positive('El monto asignado debe ser positivo'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']),
  isActive: z.boolean().default(true),
});

export type PettyCashForm = z.infer<typeof pettyCashFormSchema>;

export const pettyCashSchema = pettyCashFormSchema.extend({
  id: z.string().uuid(),
  currentBalance: z.number().optional(),
  createdAt: z.string().optional(),
});

export type PettyCashFund = z.infer<typeof pettyCashSchema>;

export const replenishPettyCashSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  concept: z.string().min(1, 'El concepto es requerido'),
});

export type ReplenishPettyCashForm = z.infer<typeof replenishPettyCashSchema>;
