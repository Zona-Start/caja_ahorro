import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const ProductPricePaginationSchema = PaginationSchema.extend({
  productId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
  priceType: z.string().optional(),
});

export class ProductPricePaginationDto extends createZodDto(ProductPricePaginationSchema) {}
