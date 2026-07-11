import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FixedAssetPricePaginationSchema = PaginationSchema.extend({
  fixedAssetsId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class FixedAssetPricePaginationDto extends createZodDto(
  FixedAssetPricePaginationSchema,
) {}
