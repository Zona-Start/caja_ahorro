import { z } from 'zod';

const emptyStringToUndefined = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.any(),
);

export const fixedAssetSchema = z.object({
  id: z.number().nullable().optional(),
  categoryId: z.number({ required_error: 'La categoría es requerida' }),
  assetCode: z.string().optional().nullable(),
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre no puede estar vacío'),
  description: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  acquisitionDate: z.date({
    required_error: 'La fecha de adquisición es requerida',
  }),
  assetStatus: z
    .string({
      required_error: 'El estado del activo es requerido',
    })
    .optional(),
  usefulLifeYears: emptyStringToUndefined.pipe(
    z.coerce
      .number({ invalid_type_error: 'La vida útil debe ser un número' })
      .int('Debe ser un número entero')
      .optional()
      .nullable(),
  ),
  depreciationMethod: z.string().optional().nullable(),
  accumulatedDepreciation: emptyStringToUndefined.pipe(
    z.coerce
      .number({ invalid_type_error: 'Debe ser un número' })
      .optional()
      .nullable(),
  ),
  lastDepreciationDate: z.date().optional().nullable(),
  disposalDate: z.date().optional().nullable(),
  disposalReason: z.string().optional().nullable(),
  disposalValue: emptyStringToUndefined.pipe(
    z.coerce
      .number({ invalid_type_error: 'Debe ser un número' })
      .optional()
      .nullable(),
  ),
  baseCost: z.coerce
    .number({
      required_error: 'El costo es requerido',
    })
    .min(0, 'El costo debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El costo debe ser un número válido',
    }),
  otherCosts: z.coerce.number().refine((val) => !isNaN(val), {
    message: 'Otro costo debe ser un número válido',
  }),
  purchaseTax: z.coerce
    .number({
      required_error: 'El costo es requerido',
    })
    .min(0, 'El costo debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El costo debe ser un número válido',
    }),
});

export type FixedAsset = z.infer<typeof fixedAssetSchema>;
