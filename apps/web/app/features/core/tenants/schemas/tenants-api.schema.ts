import { z } from 'zod';
import { tenantSchema } from './tenants.schema';

export const tenantsMetaSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
});

export const tenantsListResponseSchema = z.object({
  data: z.array(tenantSchema),
  meta: tenantsMetaSchema,
});

export const tenantCountResponseSchema = z.object({
  count: z.number().nonnegative(),
});
export const tenantDeleteResponseSchema = z.object({
  message: z.string(),
});
export const tenantByRifResponseSchema = tenantSchema.nullable();

