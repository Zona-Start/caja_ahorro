import { z } from 'zod';

export const CreateServicePriceSchema = z.object({
  serviceId: z.string().uuid('Service ID inválido'),
  suppliersId: z.string().uuid().optional(),
  baseCost: z.preprocess(
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  supplierInvoiceId: z.string().uuid().optional(),
});

export const UpdateServicePriceSchema = CreateServicePriceSchema.partial();

export type CreateServicePriceDto = z.infer<typeof CreateServicePriceSchema>;
export type UpdateServicePriceDto = z.infer<typeof UpdateServicePriceSchema>;
