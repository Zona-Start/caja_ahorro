import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';

export const WithdrawalTypePaginationSchema = PaginationSchema.extend({});

export class WithdrawalTypePaginationDto extends createZodDto(
  WithdrawalTypePaginationSchema,
) {}
