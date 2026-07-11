import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProductPricePaginationSchema = PaginationSchema.extend({
  productId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
  priceType: z.string().optional(),
});

export class ProductPricePaginationDto extends createZodDto(
  ProductPricePaginationSchema,
) {}
