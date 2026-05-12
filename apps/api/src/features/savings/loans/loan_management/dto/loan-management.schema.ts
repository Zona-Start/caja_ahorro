import { z } from 'zod';
import { loanModalityTypeEnum, paymentMethodEnum, LoanStatusEnum } from '@/types/enum';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const CreateLoanSchema = z.object({
  associateId: z.string().uuid(),
  loanTypeId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  loanModality: z.nativeEnum(loanModalityTypeEnum),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  startDate: z.string(),
  description: z.string().optional(),
  overdraftAmount: z.number().optional(),
  previousLoanId: z.string().uuid().optional().nullable(),
  termType: z.string().optional(),
  termUnits: z.number().int().positive().optional(),
  interestRate: z.number().positive().optional(),
  expensesPercentage: z.number().min(0).optional(),
  disbursementAccountId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional(),
});

export const FilterLoanSchema = PaginationSchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
  modality: z.string().optional(),
});

export const UpdateLoanSchema = z.object({
  associateId: z.string().uuid().optional(),
  loanTypeId: z.string().uuid().optional(),
  requestedAmount: z.number().positive().optional(),
  loanModality: z.nativeEnum(loanModalityTypeEnum).optional(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional(),
  startDate: z.string().optional(),
  description: z.string().optional(),
  overdraftAmount: z.number().optional(),
  previousLoanId: z.string().uuid().optional().nullable(),
  termType: z.string().optional(),
  termUnits: z.number().int().positive().optional(),
  interestRate: z.number().positive().optional(),
  expensesPercentage: z.number().min(0).optional(),
  disbursementAccountId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(LoanStatusEnum).optional(),
  requestDate: z.string().optional(),
  notes: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export type CreateLoanDto = z.infer<typeof CreateLoanSchema>;
export type FilterLoanDto = z.infer<typeof FilterLoanSchema>;
export type UpdateLoanDto = z.infer<typeof UpdateLoanSchema>;
