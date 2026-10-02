import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';
import { z } from 'zod';

export const InquiryFilterSchema = PaginationSchema.extend({
  associateId: z.string().uuid(),
});

export const InquiryStatementFilterSchema = z.object({
  cedula: z.string().min(1),
});

export const OverchargeMovementTypeSchema = z.enum([
  'SAVING_WITHDRAWAL_REVERSAL_CREDIT',
  'LOAN_PAYMENT_REVERSAL_CREDIT',
  'COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT',
]);

export const InquiryOverchargeFilterSchema = PaginationSchema.extend({
  movementType: OverchargeMovementTypeSchema,
});

export class InquiryFilterDto extends createZodDto(InquiryFilterSchema) {}
export class InquiryStatementFilterDto extends createZodDto(
  InquiryStatementFilterSchema,
) {}
export class InquiryOverchargeFilterDto extends createZodDto(
  InquiryOverchargeFilterSchema,
) {}
