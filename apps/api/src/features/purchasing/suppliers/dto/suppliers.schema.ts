import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  tenantId: z.string().uuid().optional(),
  name: z.string().min(1),
  taxId: z.string().min(1),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  state: z.number().int().optional(),
  address: z.string().optional(),
  category: z.string(),
  status: z.string().optional(),
});

export const FilterSupplierSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  name: z.string().optional(),
  taxId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;
export type FilterSupplierDto = z.infer<typeof FilterSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof UpdateSupplierSchema>;
