import { z } from 'zod';

export const cashRegisterFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la caja es requerido')
    .max(100, 'Máximo 100 caracteres'),
  isActive: z.boolean().default(true),
});

export type CashRegisterForm = z.infer<typeof cashRegisterFormSchema>;

export const cashRegisterSchema = cashRegisterFormSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().optional(),
});

export type CashRegister = z.infer<typeof cashRegisterSchema>;

export const openSessionSchema = z.object({
  cashRegisterId: z.string().uuid('Selecciona una caja registradora'),
  initialBalance: z.coerce
    .number()
    .min(0, 'El saldo inicial no puede ser negativo'),
});

export type OpenSessionForm = z.infer<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  actualPhysicalBalance: z.coerce
    .number()
    .min(0, 'El conteo físico no puede ser negativo'),
});

export type CloseSessionForm = z.infer<typeof closeSessionSchema>;
