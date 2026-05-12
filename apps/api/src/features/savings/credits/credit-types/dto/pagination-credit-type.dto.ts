import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';

export const CreditTypePaginationSchema = PaginationSchema.extend({});

export class CreditTypePaginationDto extends createZodDto(
  CreditTypePaginationSchema,
) {}
