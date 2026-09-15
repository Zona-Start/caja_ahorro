import { z } from 'zod';

export const expenseCategorySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  name: z.string(),
  accountingAccountId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const expenseCategoryMutationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(255, 'Máximo 255 caracteres'),
  accountingAccountId: z
    .string()
    .uuid('Debe ser un UUID válido')
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
});

export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type ExpenseCategoryMutation = z.infer<
  typeof expenseCategoryMutationSchema
>;
