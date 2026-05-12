import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const LoanTypePaginationSchema = PaginationSchema.extend({});

export class LoanTypePaginationDto extends createZodDto(LoanTypePaginationSchema) {}
