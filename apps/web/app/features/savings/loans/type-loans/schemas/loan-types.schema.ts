import { z } from 'zod';

export const loanTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  interestRate: z.number().min(0).max(100),
  termType: z.enum(['Plazos', 'Cuotas']),
  termUnits: z.number().int().positive(),
  cancellationPercentage: z.number().min(0).max(100).optional().nullable(),
  loanAccountChartId: z.string().uuid().nullable().optional(),
  interestEarnedAccountChartId: z.string().uuid().nullable().optional(),
  specialQuotaAccountChartId: z.string().uuid().nullable().optional(),
  expenseAccountChartId: z.string().uuid().nullable().optional(),
  specialQuotaNumber: z.number().int().min(0).optional().nullable(),
  specialQuotaPercentage: z.number().min(0).max(100).optional().nullable(),
  maxLoanAmount: z.number().min(0).optional().nullable(),
  minLoanAmount: z.number().min(0).optional().nullable(),
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

export const loanTypeMutationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  interestRate: z
    .number()
    .min(0, 'La tasa de interés debe ser mayor o igual a 0')
    .max(100, 'La tasa de interés no puede superar 100%'),
  termType: z.enum(['Plazos', 'Cuotas'], {
    required_error: 'El tipo de plazo es requerido',
  }),
  termUnits: z
    .number()
    .int()
    .positive('Las unidades del plazo deben ser un número positivo'),
  cancellationPercentage: z
    .number()
    .min(0)
    .max(100)
    .optional(),
  loanAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  interestEarnedAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  specialQuotaAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  expenseAccountChartId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  specialQuotaNumber: z.number().int().min(0).optional(),
  specialQuotaPercentage: z.number().min(0).max(100).optional(),
  maxLoanAmount: z.number().min(0).optional(),
  minLoanAmount: z.number().min(0).optional(),
  payrollTypeId: z.string().uuid('Debe ser un UUID válido').optional().nullable(),
  administrativeExpensePercentage: z.number().min(0).max(100).optional(),
  minimumSeniorityMonths: z.number().int().min(0).optional(),
  acceptsDebitBalance: z.boolean().default(false),
  acceptsGuarantors: z.boolean().default(false),
  acceptsAvailability: z.boolean().default(false),
  acceptsRefinancing: z.boolean().default(false),
});

export type LoanType = z.infer<typeof loanTypeSchema>;
export type LoanTypeMutation = z.infer<typeof loanTypeMutationSchema>;