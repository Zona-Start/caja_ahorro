import { z } from 'zod';
import { creditModalityTypeEnum } from '@/types/enum';

export const CreditItemSchema = z.object({
  agreedSellingPrice: z.number().positive(),
  itemDescription: z.string().optional(),
  itemId: z.number().int().positive().optional(),
  itemType: z.enum(['PRODUCT', 'SERVICE', 'EXTERNAL']),
  quantity: z.number().int().positive(),
  saleDate: z.coerce.date(),
  days: z.number().int().positive().optional(),
});

export const CreateCreditSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateId: z.string().uuid(),
  creditTypeId: z.string().uuid(),
  creditModality: z.nativeEnum(creditModalityTypeEnum),
  requestDate: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  requestedAmount: z.number().positive(),
  overdraftAmount: z.number().optional(),
  previousCreditId: z.string().uuid().optional(),
  notes: z.string().optional(),
  invoiceNumber: z.string().optional(),
  commercialHouseId: z.string().uuid().optional(),
  useCommercialHouse: z.boolean(),
  creditItems: z.array(CreditItemSchema).optional(),
  interestRate: z.number().positive().optional(),
  termType: z.string().optional(),
  termUnits: z.number().int().positive().optional(),
});

export const FilterCreditSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  searchType: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.string().optional(),
  type: z.string().uuid().optional(),
  modality: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export const UpdateCreditSchema = z.object({
  tenantId: z.string().uuid().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateCreditDto = z.infer<typeof CreateCreditSchema>;
export type FilterCreditDto = z.infer<typeof FilterCreditSchema>;
export type UpdateCreditDto = z.infer<typeof UpdateCreditSchema>;
export type CreditItemDto = z.infer<typeof CreditItemSchema>;
