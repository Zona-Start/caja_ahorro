import { z } from 'zod';

export const accountingConfigurationSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  key: z.string().min(1, 'La clave es requerida'),
  operationType: z.string().min(1, 'El tipo de operación es requerido'),
  descriptionTemplate: z.string().optional(),
  debitAccountId: z.number().optional().nullable(),
  creditAccountId: z.number().optional().nullable(),
  contraAccountId: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type AccountingConfiguration = z.infer<
  typeof accountingConfigurationSchema
>;
