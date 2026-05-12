import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const FixedAssetPaginationSchema = PaginationSchema.extend({
  typeCategory: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().date().or(z.string().datetime()).optional(),
  endDate: z.string().date().or(z.string().datetime()).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
});

export class FixedAssetPaginationDto extends createZodDto(FixedAssetPaginationSchema) {}
