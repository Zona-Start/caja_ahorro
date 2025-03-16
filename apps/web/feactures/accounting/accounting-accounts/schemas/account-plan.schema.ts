import { z } from 'zod';

export const accountPlanSchema = z
  .object({
    id: z.number().optional(),
    savingBankId: z.number(),
    code: z
      .string()
      .min(1, 'El código es requerido')
      .max(50, 'El código no puede tener más de 50 caracteres')
      .regex(/^[\d.]+$/, 'El código debe contener solo números y puntos'),
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre no puede tener más de 100 caracteres'),
    type: z.enum(
      [
        'activo',
        'pasivo',
        'patrimonio',
        'ingreso',
        'gasto',
        'costo',
        'cuenta_orden',
      ],
      {
        required_error: 'El tipo de cuenta es requerido',
        invalid_type_error: 'Tipo de cuenta inválido',
      },
    ),
    description: z.string().optional().nullable(),
    level: z
      .number()
      .min(1, 'El nivel debe ser mayor a 0')
      .max(4, 'El nivel no puede ser mayor a 4'),
    parent_account_id: z.number().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.level > 1 && !data.parent_account_id) {
        return false;
      }
      return true;
    },
    {
      message: 'Las cuentas de nivel superior a 1 requieren una cuenta padre',
      path: ['parent_account_id'],
    },
  );

export type AccountPlan = z.infer<typeof accountPlanSchema>;

// Response schemas for the API
export const accountPlanResponseSchema = z.object({
  message: z.string(),
  data: accountPlanSchema,
});

export const accountPlanDeleteResponseSchema = z.object({
  message: z.string(),
});

export const accountPlanListResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountPlanSchema),
});

export const accountPlanPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountPlanSchema),
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
