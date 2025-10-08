import { z } from 'zod';

export const typeCreditSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  interestRate: z.string(),
  termType: z.enum(['Cuotas', 'Plazos']),
  termUnits: z.number(),
  cancellationPercentage: z.string().optional().nullable(),
  creditAccountChartId: z.number(),
  interestEarnedAccountChartId: z.number(),
  specialQuotaAccountChartId: z.number().optional().nullable(),
  expenseAccountChartId: z.number().optional().nullable(),
  specialQuotaNumber: z.number().optional().nullable(),
  specialQuotaPercentage: z.string().optional(),
  maxCreditAmount: z.string().nullable().optional(),
  minCreditAmount: z.string().nullable().optional(),
  payrollTypeId: z.number().nullable().optional(),
  administrativeExpensePercentage: z.string().optional().nullable(),
  minimumSeniorityMonths: z.number().optional().nullable(),
  acceptsDebitBalance: z.boolean().optional().nullable(),
  acceptsGuarantors: z.boolean().optional().nullable(),
  acceptsAvailability: z.boolean().optional().nullable(),
  acceptsRefinancing: z.boolean().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.number().optional().nullable(),
  updatedById: z.number().optional().nullable(),
});

// Define el tipo TypesCredit basado en el esquema de Zod
export type TypesCredit = z.infer<typeof typeCreditSchema>;

// Response schemas for the API create, update
export const typeCreditApiResponseSchema = z.object({
  message: z.string(),
  data: typeCreditSchema,
});

// Response schemas for the API delete
export const typeCreditDeleteResponseSchema = z.object({
  message: z.string(),
});

// Update the paginated response schema to use the API schema
export const typeCreditAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(typeCreditSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});
