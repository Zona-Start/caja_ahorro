import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const ServicePaginationSchema = PaginationSchema.extend({
  name: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export class ServicePaginationDto extends createZodDto(ServicePaginationSchema) {}
