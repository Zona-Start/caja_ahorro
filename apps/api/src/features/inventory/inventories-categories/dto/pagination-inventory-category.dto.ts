import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InventoryCategoryPaginationSchema = PaginationSchema.extend({
  group: z.string().optional(),
});

export class InventoryCategoryPaginationDto extends createZodDto(
  InventoryCategoryPaginationSchema,
) {}
