import { z } from 'zod';
import { supplierSchema } from './suppliers.schema';

export const suppliersMetaSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
});

export const suppliersListResponseSchema = z.object({
  data: z.array(supplierSchema),
  meta: suppliersMetaSchema,
});

export const supplierDeleteResponseSchema = z.object({
  message: z.string(),
});
