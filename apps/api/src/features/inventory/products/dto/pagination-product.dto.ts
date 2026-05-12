import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const ProductPaginationSchema = PaginationSchema.extend({
  status: z.string().optional(),
  typeCategory: z.string().uuid().optional(),
});

export class ProductPaginationDto extends createZodDto(ProductPaginationSchema) {}
