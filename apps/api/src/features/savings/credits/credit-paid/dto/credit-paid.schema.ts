import { creditPaymetTypeEnum, paymentMethodEnum } from '@/types/enum';
import { z } from 'zod';

export const CreateCreditPaidSchema = z.object({
  tenantId: z.string().uuid().optional(),
  amount: z.number().positive(),
  creditId: z.string().uuid(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  paymentType: z.nativeEnum(creditPaymetTypeEnum),
  comment: z.string().optional(),
  transactionReference: z.string().optional(),
  bankId: z.string().uuid().optional(),
});

export const FilterCreditPaidSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  bank: z.string().optional(),
  type: z.string().optional(),
  method: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export type CreateCreditPaidDto = z.infer<typeof CreateCreditPaidSchema>;
export type FilterCreditPaidDto = z.infer<typeof FilterCreditPaidSchema>;
