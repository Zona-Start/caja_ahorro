import { z } from 'zod';

export const withdrawalTypesSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, { message: 'Nombre es requerido' }),
  withdrawalPercentage: z
    .string()
    .min(1, { message: 'Porcentaje es requerido' }),
  // accountDebit: z.number({ message: 'Requerido' }).min(1),
  // expenseAccount: z.number({ message: 'Requerido' }).min(1),
  administrativeFeePercentage: z
    .string()
    .min(1, { message: 'Porcentaje es requerido' }),
  withdrawalLimitQuantity: z.number().optional().nullable(),
  minimumAntiquityDays: z.number().nullable().optional(),
  withdrawalFrequencyRelation: z.number({ message: 'Requerido' }).min(1),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
});

export type WithdrawalTypes = z.infer<typeof withdrawalTypesSchema>;
