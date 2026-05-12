import { z } from 'zod';

export const bankFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del banco es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  code: z
    .string()
    .min(1, 'El código del banco es requerido')
    .max(20, 'El código no puede superar 20 caracteres'),
  countryCode: z
    .string()
    .min(2, 'El código de país es requerido')
    .max(4, 'El código de país no puede superar 4 caracteres'),
  isActive: z.boolean().default(true),
});

export type BankForm = z.infer<typeof bankFormSchema>;

export const bankResponseSchema = bankFormSchema.extend({
  id: z.number(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Bank = z.infer<typeof bankResponseSchema>;

export const banksListResponseSchema = z.object({
  message: z.string(),
  data: z.array(bankResponseSchema),
});
