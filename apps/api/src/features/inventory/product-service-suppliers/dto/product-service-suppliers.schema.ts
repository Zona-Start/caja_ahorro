import { z } from 'zod';

// Esquema base del objeto (sin refine)
const baseSchema = z.object({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  fixedAssetsId: z.string().uuid().optional(),
  suppliersId: z.string().uuid('Supplier ID inválido'),
  leadTimeDays: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).default(0),
  ),
  preferred: z.boolean().default(false),
});

// Validación común: al menos uno de los tres IDs debe existir
const atLeastOneRequired = (data: any) =>
  !!(data.productId || data.serviceId || data.fixedAssetsId);
const refineOptions = {
  message: 'Se requiere productId, serviceId o fixedAssetsId',
};

// Esquema para creación (obligatorio al menos un ID)
export const CreateProductServiceSupplierSchema = baseSchema.refine(
  atLeastOneRequired,
  refineOptions,
);

// Esquema para actualización (todos los campos opcionales, pero al menos un ID)
export const UpdateProductServiceSupplierSchema = baseSchema
  .partial()
  .refine(atLeastOneRequired, refineOptions);

export type CreateProductServiceSupplierDto = z.infer<
  typeof CreateProductServiceSupplierSchema
>;
export type UpdateProductServiceSupplierDto = z.infer<
  typeof UpdateProductServiceSupplierSchema
>;
