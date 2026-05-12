import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const WithdrawalTypePaginationSchema = PaginationSchema.extend({});

export class WithdrawalTypePaginationDto extends createZodDto(WithdrawalTypePaginationSchema) {}
