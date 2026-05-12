import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  productPrice: z.string().nullable(),
  available: z.number().nullable(),
});

export const ProductsApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(ProductSchema),
});

export type Product = z.infer<typeof ProductSchema>;
