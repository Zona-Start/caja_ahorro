import { z } from 'zod';

export const creditTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  interestRate: z.number().min(0).max(100),
  termType: z.enum(['Plazos', 'Cuotas']),
  termUnits: z.number().int().positive(),
  cancellationPercentage: z.number().min(0).max(100).optional().nullable(),
  creditAccountChartId: z.string().uuid().nullable().optional(),
  interestEarnedAccountChartId: z.string().uuid().nullable().optional(),
  specialQuotaAccountChartId: z.string().uuid().nullable().optional(),
  expenseAccountChartId: z.string().uuid().nullable().optional(),
  specialQuotaNumber: z.number().int().min(0).optional().nullable(),
  specialQuotaPercentage: z.number().min(0).max(100).optional().nullable(),
  maxCreditAmount: z.number().min(0).optional().nullable(),
  minCreditAmount: z.number().min(0).optional().nullable(),
  payrollTypeId: z.string().uuid().nullable().optional(),
  administrativeExpensePercentage: z.number().min(0).max(100).optional().nullable(),
  minimumSeniorityMonths: z.number().int().min(0).optional().nullable(),
  acceptsDebitBalance: z.boolean().default(false),
  acceptsGuarantors: z.boolean().default(false),
  acceptsAvailability: z.boolean().default(false),
  acceptsRefinancing: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const creditTypeMutationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  interestRate: z
    .number({
      required_error: 'La tasa de interés es requerida',
      invalid_type_error: 'La tasa de interés debe ser un número',
    })
    .min(0, 'La tasa de interés debe ser mayor o igual a 0')
    .max(100, 'La tasa de interés no puede superar 100%'),
  termType: z.enum(['Plazos', 'Cuotas'], {
    required_error: 'El tipo de plazo es requerido',
  }),
  termUnits: z
    .number({
      required_error: 'Las unidades del plazo son requeridas',
      invalid_type_error: 'Las unidades del plazo deben ser un número',
    })
    .int('Las unidades del plazo deben ser un número entero')
    .positive('Las unidades del plazo deben ser un número positivo'),
  cancellationPercentage: z
    .number()
    .min(0)
    .max(100)
    .optional(),
  creditAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  interestEarnedAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  specialQuotaAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  expenseAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  specialQuotaNumber: z.number().int().min(0).optional(),
  specialQuotaPercentage: z.number().min(0).max(100).optional(),
  maxCreditAmount: z.number().min(0).optional(),
  minCreditAmount: z.number().min(0).optional(),
  payrollTypeId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  administrativeExpensePercentage: z
    .number({
      required_error: 'El porcentaje de gasto administrativo es requerido',
      invalid_type_error: 'El porcentaje de gasto administrativo debe ser un número',
    })
    .min(0, 'El porcentaje de gasto administrativo debe ser mayor o igual a 0')
    .max(100, 'El porcentaje de gasto administrativo no puede superar 100%'),
  minimumSeniorityMonths: z.number().int().min(0).optional(),
  acceptsDebitBalance: z.boolean().default(false),
  acceptsGuarantors: z.boolean().default(false),
  acceptsAvailability: z.boolean().default(false),
  acceptsRefinancing: z.boolean().default(false),
});

export type CreditType = z.infer<typeof creditTypeSchema>;
export type CreditTypeMutation = z.infer<typeof creditTypeMutationSchema>;