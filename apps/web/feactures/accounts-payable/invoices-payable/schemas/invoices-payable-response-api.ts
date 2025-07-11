import { z } from 'zod';

// RESPONSE API SCHEMA
export const invoicesPayableApiSchema = z.object({
  id: z.number(),
  supplierId: z.number(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  concept: z.string(),
  status: z.string().optional(), // Puedes reemplazar por z.enum([...])
  observations: z.string().optional(),
});

//schema response query pagination
export const invoicesPayableResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(invoicesPayableApiSchema),
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

// Response schemas for the API by Create, Update, QuerryOne
export const invoicesPayableResponseOneSchema = z.object({
  message: z.string(),
  data: invoicesPayableApiSchema,
});

//schema response delete mutation
export const invoicesPayableDeleteResponseSchema = z.object({
  message: z.string(),
});

export const invoicesPayableApiCountSchema = z.object({
  totalAmount: z.string().nullable(),
  pendingAmount: z.string().nullable(),
  paidAmount: z.string().nullable(),
  overdueAmount: z.string().nullable(),
});

export const invoicesPayableResponseCountSchema = z.object({
  message: z.string(),
  data: invoicesPayableApiCountSchema,
});
