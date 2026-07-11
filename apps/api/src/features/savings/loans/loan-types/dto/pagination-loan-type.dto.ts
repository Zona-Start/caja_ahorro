import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';

export const LoanTypePaginationSchema = PaginationSchema.extend({});

export class LoanTypePaginationDto extends createZodDto(
  LoanTypePaginationSchema,
) {}
