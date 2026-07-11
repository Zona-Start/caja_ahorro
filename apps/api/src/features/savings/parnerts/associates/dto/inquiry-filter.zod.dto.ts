import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';
import { z } from 'zod';

export const InquiryFilterSchema = PaginationSchema.extend({
  associateId: z.string().uuid(),
});

export const InquiryStatementFilterSchema = z.object({
  cedula: z.string().min(1),
});

export class InquiryFilterDto extends createZodDto(InquiryFilterSchema) {}
export class InquiryStatementFilterDto extends createZodDto(
  InquiryStatementFilterSchema,
) {}
