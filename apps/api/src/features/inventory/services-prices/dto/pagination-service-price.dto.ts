import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ServicePricePaginationSchema = PaginationSchema.extend({
  serviceId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class ServicePricePaginationDto extends createZodDto(
  ServicePricePaginationSchema,
) {}
