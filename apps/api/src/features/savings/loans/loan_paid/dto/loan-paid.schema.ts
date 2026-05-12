import { z } from 'zod';
import { loanPaymetTypeEnum, paymentMethodEnum } from '@/types/enum';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const CreateLoanPaidSchema = z.object({
  amount: z.number().positive(),
  loanId: z.string().uuid(),
  paymentDate: z.string(),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  paymentType: z.nativeEnum(loanPaymetTypeEnum).optional(),
  comment: z.string().optional(),
  transactionReference: z.string().optional(),
  bankId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional(),
});

export const FilterLoanPaidSchema = PaginationSchema.extend({
  bank: z.string().optional(),
  type: z.string().optional(),
  method: z.string().optional(),
});

export const CreateBulkLoanPaidSchema = z.object({
  bankId: z.string().optional(),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  paymentType: z.nativeEnum(loanPaymetTypeEnum),
  comment: z.string().optional(),
  transactionReference: z.string().optional(),
  paymentDate: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export type CreateLoanPaidDto = z.infer<typeof CreateLoanPaidSchema>;
export type FilterLoanPaidDto = z.infer<typeof FilterLoanPaidSchema>;
export type CreateBulkLoanPaidDto = z.infer<typeof CreateBulkLoanPaidSchema>;
