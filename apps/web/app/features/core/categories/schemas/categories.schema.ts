import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  type: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  isActive: z.boolean(),
  tenantId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdById: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
});

export const categoryMutationSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1, 'El tipo es requerido').max(50),
  code: z.string().min(1, 'El código es requerido').max(20),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const CATEGORY_TYPES = {
  ASSOCIATE_TYPE: 'associate_type',
  DISCOUNT_FREQUENCY: 'discount_frequency',
  PAYROLL_TYPE: 'payroll_type',
  NATIONALITY: 'nationality',
  GENDER: 'gender',
  DOCUMENT_TYPE: 'document_type',
  CIVIL_STATUS: 'civil_status',
  ACCOUNT_TYPE: 'account_type',
  TRANSACTION_TYPE: 'transaction_type',
} as const;

export type Category = z.infer<typeof categorySchema>;
export type CategoryMutation = z.infer<typeof categoryMutationSchema>;
export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];