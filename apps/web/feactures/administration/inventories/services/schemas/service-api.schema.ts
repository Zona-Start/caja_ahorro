import { z } from 'zod';

export const serviceApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  suppliersId: z.number(),
  suppliersName: z.string().optional(),
  defaultCost: z.string(),
  status: z.string(),
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
