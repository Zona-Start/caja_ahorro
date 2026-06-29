import { z } from 'zod';
import { creditModalityTypeEnum, paymentMethodEnum } from '@/types/enum';

export const CreditItemSchema = z.object({
  agreedSellingPrice: z.number().positive(),
  itemDescription: z.string().optional(),
  itemId: z.string().uuid().optional(),
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
  expensesPercentage: z.number().min(0).max(100).optional(),
  commercialHouseType: z.enum(['inventory', 'supplier']).optional(),
  commercialHouseSupplierId: z.string().uuid().optional(),
  useSpecialParams: z.boolean().optional(),
  allowOverdraft: z.boolean().optional(),
  haberesPayment: z.number().min(0).optional(),
  directPayment: z.number().min(0).optional(),
  directPaymentMethod: z.string().optional(),
  directPaymentReference: z.string().optional(),
  directPaymentBankAccountId: z.string().uuid().optional(),
  itemsJson: z.string().optional(),
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

export type CreateCreditDto = z.infer<typeof CreateCreditSchema>;
export type FilterCreditDto = z.infer<typeof FilterCreditSchema>;
export type UpdateCreditDto = z.infer<typeof UpdateCreditSchema>;
export type CreditItemDto = z.infer<typeof CreditItemSchema>;
export type SearchAssociateDto = z.infer<typeof SearchAssociateSchema>;
export type CalculateAmortizationDto = z.infer<typeof CalculateAmortizationSchema>;
