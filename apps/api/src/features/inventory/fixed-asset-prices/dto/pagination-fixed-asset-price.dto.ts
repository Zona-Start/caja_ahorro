import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const FixedAssetPricePaginationSchema = PaginationSchema.extend({
  fixedAssetsId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class FixedAssetPricePaginationDto extends createZodDto(FixedAssetPricePaginationSchema) {}
