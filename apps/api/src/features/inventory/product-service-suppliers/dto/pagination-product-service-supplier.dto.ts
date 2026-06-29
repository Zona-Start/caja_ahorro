import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const ProductServiceSupplierPaginationSchema = PaginationSchema.extend({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  fixedAssetsId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class ProductServiceSupplierPaginationDto extends createZodDto(ProductServiceSupplierPaginationSchema) {}
