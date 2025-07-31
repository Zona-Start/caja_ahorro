import { z } from 'zod';

// RESPONSE API SCHEMA
export const supplierApiSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  taxId: z.string(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  state: z.number().optional(), // Puede ser null en la BD, por eso optional
  address: z.string().optional(),
  category: z.string(),
  status: z.string().optional(),
});

//schema response query pagination
export const supplierResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierApiSchema),
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
export const supplierResponseOneSchema = z.object({
  message: z.string(),
  data: supplierApiSchema,
});

//schema response delete mutation
export const supplierDeleteResponseSchema = z.object({
  message: z.string(),
});

export const supplierApiCountSchema = z.object({
  totalActive: z.string(),
  totalInactive: z.string(),
  totalSupended: z.string(),
});

export const supplierResponseCountSchema = z.object({
  message: z.string(),
  data: supplierApiCountSchema,
});

export const supplierAllApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  taxId: z.string(),
});

export const supplierAllSchema = z.object({
  message: z.string(),
  data: z.array(supplierAllApiSchema),
});
