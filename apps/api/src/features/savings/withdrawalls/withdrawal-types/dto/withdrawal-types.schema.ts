import { z } from 'zod';

export const CreateWithdrawalTypeSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(255),
  withdrawalPercentage: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().min(0).max(100).optional(),
    ),
  accountDebit: z.string().uuid().optional(),
  expenseAccount: z.string().uuid().optional(),
  administrativeFeePercentage: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().min(0).max(100).optional(),
    ),
  withdrawalLimitQuantity: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().min(0).optional(),
    ),
  minimumAntiquityDays: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().min(0).optional(),
    ),
  withdrawalFrequencyRelation: z.string().uuid().optional(),
  isHouseComercial: z.boolean().default(false),
  isInternalInventory: z.boolean().default(false),
});

export const UpdateWithdrawalTypeSchema = CreateWithdrawalTypeSchema.partial();

export type CreateWithdrawalTypeDto = z.infer<typeof CreateWithdrawalTypeSchema>;
export type UpdateWithdrawalTypeDto = z.infer<typeof UpdateWithdrawalTypeSchema>;
