import { z } from 'zod';

export const CreateServiceSchema = z.object({
  categoryId: z.string().uuid('Category ID inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  serviceType: z.string().max(50).optional().default('USO_INTERNO'),
  description: z.string().optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional().default('VES'),
  purchaseExchangeRate: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(1),
  ),
  supplierCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0),
  ),
  otherCosts: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  purchaseTax: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  suppliers: z
    .array(
      z.object({
        suppliersId: z.string().uuid(),
        leadTimeDays: z.preprocess(
          (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
          z.number().int().min(0).default(0),
        ),
      }),
    )
    .optional(),
});

export const UpdateServiceSchema = CreateServiceSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
}).partial();

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
