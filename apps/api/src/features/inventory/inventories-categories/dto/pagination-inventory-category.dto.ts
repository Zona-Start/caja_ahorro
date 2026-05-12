import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const InventoryCategoryPaginationSchema = PaginationSchema.extend({
  group: z.string().optional(),
});

export class InventoryCategoryPaginationDto extends createZodDto(
  InventoryCategoryPaginationSchema,
) {}
