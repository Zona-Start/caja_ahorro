import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const ServicePricePaginationSchema = PaginationSchema.extend({
  serviceId: z.string().uuid().optional(),
  suppliersId: z.string().uuid().optional(),
});

export class ServicePricePaginationDto extends createZodDto(ServicePricePaginationSchema) {}
