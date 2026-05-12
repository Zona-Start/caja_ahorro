import { z } from 'zod';
import { paymentMethodEnum } from '@/types/enum';

const withdrawalItemSchema = z.object({
  itemType: z.string(),
  itemDescription: z.string().optional().nullable(),
  itemId: z.number().int().optional().nullable(),
  quantity: z.number().positive(),
  agreedSellingPrice: z.number().positive(),
  days: z.string().optional().nullable(),
});

export const CreateWithdrawalAssociateSchema = z.object({
  associateAccountId: z.string().uuid(),
  withdrawalTypeId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  date: z.coerce.date(),
  description: z.string().optional(),
  commercialHouseId: z.string().uuid().optional().nullable(),
  withdrawalItems: z.array(withdrawalItemSchema).optional(),
  tenantId: z.string().uuid().optional(),
});

export const DisburseWithdrawalAssociateSchema = z.object({
  bankAccountId: z.string().uuid(),
  processedAt: z.coerce.date(),
  bankReference: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export const FilterWithdrawalAssociateSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: z.string().optional(),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export type CreateWithdrawalAssociateDto = z.infer<typeof CreateWithdrawalAssociateSchema>;
export type DisburseWithdrawalAssociateDto = z.infer<typeof DisburseWithdrawalAssociateSchema>;
export type FilterWithdrawalAssociateDto = z.infer<typeof FilterWithdrawalAssociateSchema>;
