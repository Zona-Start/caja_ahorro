import { z } from 'zod';

export const typeCreditSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: 'Nombre es requerido' }),
  description: z.string().optional().nullable(),
  interestRate: z
    .string({ message: 'Requerido' })
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
      message: 'Debe ser un número mayor o igual a 1',
    })
    .default('1'),
  termType: z.enum(['Cuotas', 'Plazos']),
  termUnits: z
    .string({ message: 'Requerido' })
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
      message: 'Debe ser un número mayor o igual a 1',
    })
    .default('1'),
  cancellationPercentage: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  creditAccountChartId: z.number({ message: 'Requerido' }).min(1),
  interestEarnedAccountChartId: z.number({ message: 'Requerido' }).min(1),
  specialQuotaAccountChartId: z.number().optional().nullable(),
  expenseAccountChartId: z.number().optional().nullable(),
  specialQuotaNumber: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  specialQuotaPercentage: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  maxCreditAmount: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  minCreditAmount: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  payrollTypeId: z.number().nullable().optional(),
  administrativeExpensePercentage: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  minimumSeniorityMonths: z
    .string()
    .refine(
      (val) => val === null || (!isNaN(Number(val)) && Number(val) >= 0),
      {
        message: 'Debe ser un número mayor o igual a 0 o nulo',
      },
    )
    .nullable()
    .optional(),
  acceptsDebitBalance: z.boolean().optional().nullable(),
  acceptsGuarantors: z.boolean().optional().nullable(),
  acceptsAvailability: z.boolean().optional().nullable(),
  acceptsRefinancing: z.boolean().optional().nullable(),
});

export type TypeCredit = z.infer<typeof typeCreditSchema>;
