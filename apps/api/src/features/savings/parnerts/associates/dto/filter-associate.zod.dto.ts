import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const FilterAssociateSchema = PaginationSchema.extend({
  status: z.string().optional(),
  payroll: z.string().optional(),
});

export class FilterAssociateDto extends createZodDto(FilterAssociateSchema) {}
