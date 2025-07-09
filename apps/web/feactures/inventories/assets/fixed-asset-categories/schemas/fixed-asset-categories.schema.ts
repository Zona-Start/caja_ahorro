import { z } from 'zod';

export const fixedAssetCategoriesSchema = z.object({
  id: z.number().optional(),
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
  defaultUsefulLifeYears: z.number().optional().nullable(),
  defaultDepreciationMethod: z
    .string({ required_error: 'El metodo es requerido' })
    .optional()
    .nullable(),
});

export type FixedAssetCategories = z.infer<typeof fixedAssetCategoriesSchema>;
