import { PaginationSchema } from '@/common/dto/pagination.dto';
import {
  loanModalityTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import { z } from 'zod';

export const CreateLoanSchema = z.object({
  associateId: z.string().uuid(),
  loanTypeId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  loanModality: z.nativeEnum(loanModalityTypeEnum),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  startDate: z.coerce.date(),
  requestDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  termType: z.string().optional(),
  termUnits: z.number().int().positive().optional(),
  interestRate: z.number().positive().optional(),
  expensesPercentage: z.number().min(0).max(100).optional(),
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

export const SearchAssociateSchema = z.object({
  cedula: z.string().min(1).max(20),
  tenantId: z.string().uuid().optional(),
});

export const CalculateAmortizationSchema = z.object({
  amount: z.number().positive(),
  annualRate: z.number().min(0),
  paymentCount: z.number().int().positive(),
  startDate: z.coerce.date(),
  paymentType: z.enum(['installments', 'quotas']),
  expensesPercentage: z.number().min(0).max(100).optional(),
});

export const DisburseLoanSchema = z.object({
  loanId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  currencyCode: z.string().min(1),
  paymentMethod: z.string().min(1),
  disbursementDate: z.coerce.date(),
  bankReference: z.string().optional(),
  description: z.string().optional(),
});

export type CreateLoanDto = z.infer<typeof CreateLoanSchema>;
export type FilterLoanDto = z.infer<typeof FilterLoanSchema>;
export type UpdateLoanDto = z.infer<typeof UpdateLoanSchema>;
export type SearchAssociateDto = z.infer<typeof SearchAssociateSchema>;
export type CalculateAmortizationDto = z.infer<
  typeof CalculateAmortizationSchema
>;
export type DisburseLoanDto = z.infer<typeof DisburseLoanSchema>;
