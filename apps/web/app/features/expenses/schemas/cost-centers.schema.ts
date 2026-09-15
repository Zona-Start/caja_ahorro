import { z } from 'zod';

export const costCenterFormSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(50, 'Máximo 50 caracteres'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(255, 'Máximo 255 caracteres'),
  monthlyBudget: z.coerce
    .number()
    .positive('El presupuesto debe ser positivo')
    .optional(),
  isActive: z.boolean().default(true),
});

export type CostCenterForm = z.infer<typeof costCenterFormSchema>;

export const costCenterSchema = costCenterFormSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().optional(),
});

export type CostCenter = z.infer<typeof costCenterSchema>;
