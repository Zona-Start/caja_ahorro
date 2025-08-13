import { z } from 'zod';

export const serviceApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  categoryId: z.number(),
  categoryName: z.string().optional(),
  status: z.string(),
  supplierCost: z.string().optional().nullable(),
  otherCosts: z.string().optional().nullable(),
  purchaseTax: z.string().optional().nullable(),
});

export type ServiceSchemaAPI = z.infer<typeof serviceApiSchema>;

export const serviceMutationResponseSchema = z.object({
  message: z.string(),
  data: serviceApiSchema.optional(),
});

export const serviceAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(serviceApiSchema),
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

export const serviceResponseSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
});
