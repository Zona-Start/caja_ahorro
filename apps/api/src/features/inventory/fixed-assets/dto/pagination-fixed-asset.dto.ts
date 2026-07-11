import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FixedAssetPaginationSchema = PaginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  assetStatus: z.string().optional(),
  depreciationMethod: z.string().optional(),
  startDate: z.string().date().or(z.string().datetime()).optional(),
  endDate: z.string().date().or(z.string().datetime()).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
});

export class FixedAssetPaginationDto extends createZodDto(
  FixedAssetPaginationSchema,
) {}
