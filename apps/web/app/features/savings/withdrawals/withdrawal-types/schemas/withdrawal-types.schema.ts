import { z } from 'zod';

const optionalStringField = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(max, message).optional(),
  );

export const withdrawalTypeSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  withdrawalPercentage: z.number().min(0).max(100).optional().nullable(),
  accountDebit: z.string().uuid().nullable().optional(),
  expenseAccount: z.string().uuid().nullable().optional(),
  administrativeFeePercentage: z.number().min(0).max(100).optional().nullable(),
  withdrawalLimitQuantity: z.number().int().min(0).optional().nullable(),
  minimumAntiquityDays: z.number().int().min(0).optional().nullable(),
  withdrawalFrequencyRelation: z.string().uuid().nullable().optional(),
  isHouseComercial: z.boolean().default(false),
  isInternalInventory: z.boolean().default(false),
  createdAt: z.string().optional(),
  createdById: z.string().uuid().optional().nullable(),
  updatedAt: z.string().optional(),
  updatedById: z.string().uuid().optional().nullable(),
});

export const withdrawalTypeMutationSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede superar 255 caracteres'),
  withdrawalPercentage: z.number().min(0).max(100).optional(),
  accountDebit: z
    .string()
    .uuid('Debe ser un UUID válido')
    .optional()
    .nullable(),
  expenseAccount: z
    .string()
    .uuid('Debe ser un UUID válido')
    .optional()
    .nullable(),
  administrativeFeePercentage: z.number().min(0).max(100).optional(),
  withdrawalLimitQuantity: z.number().int().min(0).optional(),
  minimumAntiquityDays: z.number().int().min(0).optional(),
  withdrawalFrequencyRelation: z
    .string()
    .uuid('Debe ser un UUID válido')
    .optional()
    .nullable(),
  isHouseComercial: z.boolean().default(false),
  isInternalInventory: z.boolean().default(false),
});

export type WithdrawalType = z.infer<typeof withdrawalTypeSchema>;
export type WithdrawalTypeMutation = z.infer<
  typeof withdrawalTypeMutationSchema
>;

export const withdrawalTypeMutationApiSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  withdrawalPercentage: z.string().optional().nullable(),
  accountDebit: z.string().uuid().nullable().optional(),
  expenseAccount: z.string().uuid().nullable().optional(),
  administrativeFeePercentage: z.string().optional().nullable(),
  withdrawalLimitQuantity: z.string().optional().nullable(),
  minimumAntiquityDays: z.string().optional().nullable(),
  withdrawalFrequencyRelation: z.string().uuid().nullable().optional(),
  isHouseComercial: z.boolean().default(false),
  isInternalInventory: z.boolean().default(false),
  createdAt: z.string().optional(),
  createdById: z.string().uuid().optional().nullable(),
  updatedAt: z.string().optional(),
  updatedById: z.string().uuid().optional().nullable(),
});
