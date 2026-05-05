import { z } from 'zod';
import { tenantSchema } from './tenants.schema';

export const tenantsListResponseSchema = z.array(tenantSchema);
export const tenantCountResponseSchema = z.object({
  count: z.number().nonnegative(),
});
export const tenantDeleteResponseSchema = z.object({
  message: z.string(),
});
export const tenantByRifResponseSchema = tenantSchema.nullable();

