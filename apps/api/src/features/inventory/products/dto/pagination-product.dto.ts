import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProductPaginationSchema = PaginationSchema.extend({
  status: z.string().optional(),
  typeCategory: z.string().uuid().optional(),
});

export class ProductPaginationDto extends createZodDto(
  ProductPaginationSchema,
) {}
