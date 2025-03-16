import { z } from 'zod';

export const banksSchema = z.object({
  id: z.number().optional(),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(5, 'El código no puede tener más de 5 caracteres')
    .regex(/^[\d.]+$/, 'El código debe contener solo números y puntos'),
  name: z.string().min(1, 'El nombre es requerido'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Banks = z.infer<typeof banksSchema>;

// Response schemas for the API
export const banksResponseSchema = z.object({
  message: z.string(),
  data: banksSchema,
});

export const banksDeleteResponseSchema = z.object({
  message: z.string(),
});

export const banksListResponseSchema = z.object({
  message: z.string(),
  data: z.array(banksSchema),
});

export const banksPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(banksSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});
