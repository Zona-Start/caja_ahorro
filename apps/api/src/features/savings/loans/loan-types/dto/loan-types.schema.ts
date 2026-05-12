import { z } from 'zod';

export const CreateLoanTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  interestRate: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).max(100),
  ),
  termType: z.enum(['Plazos', 'Cuotas']),
  termUnits: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive(),
  ),
  cancellationPercentage: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().min(0).max(100).optional(),
    ),
  loanAccountChartId: z.string().uuid().optional(),
  interestEarnedAccountChartId: z.string().uuid().optional(),
  specialQuotaAccountChartId: z.string().uuid().optional(),
  expenseAccountChartId: z.string().uuid().optional(),
  specialQuotaNumber: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().min(0).optional(),
    ),
  specialQuotaPercentage: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().min(0).max(100).optional(),
    ),
  maxLoanAmount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  minLoanAmount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  payrollTypeId: z.string().uuid().optional(),
  administrativeExpensePercentage: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().min(0).max(100).optional(),
    ),
  minimumSeniorityMonths: z
    .preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().min(0).optional(),
    ),
  acceptsDebitBalance: z.boolean().default(false),
  acceptsGuarantors: z.boolean().default(false),
  acceptsAvailability: z.boolean().default(false),
  acceptsRefinancing: z.boolean().default(false),
});

export const UpdateLoanTypeSchema = CreateLoanTypeSchema.partial();

export type CreateLoanTypeDto = z.infer<typeof CreateLoanTypeSchema>;
export type UpdateLoanTypeDto = z.infer<typeof UpdateLoanTypeSchema>;
