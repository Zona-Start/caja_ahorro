import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProductServiceSupplierPaginationSchema = PaginationSchema.extend({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  fixedAssetsId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class ProductServiceSupplierPaginationDto extends createZodDto(
  ProductServiceSupplierPaginationSchema,
) {}
