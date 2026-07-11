import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ServicePaginationSchema = PaginationSchema.extend({
  name: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export class ServicePaginationDto extends createZodDto(
  ServicePaginationSchema,
) {}
