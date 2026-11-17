import { paymentMethodEnum } from '@/types/enum';
import { z } from 'zod';

const withdrawalItemSchema = z.object({
  itemType: z.string(),
  itemDescription: z.string().optional().nullable(),
  itemId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive(),
  // Precio unitario en Bs (se mantiene para compatibilidad con el detalle).
  agreedSellingPrice: z.coerce.number().min(0),
  days: z.string().optional().nullable(),
  // Datos de origen del precio del ítem.
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional().nullable(),
  exchangeRate: z.coerce.number().positive().optional().nullable(),
  originalUnitPrice: z.coerce.number().min(0).optional().nullable(),
  unitPriceBase: z.coerce.number().min(0).optional().nullable(),
  totalBase: z.coerce.number().min(0).optional().nullable(),
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
  // Moneda y tasa únicas para todos los productos del retiro.
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  goodsTotalAmount: z.coerce.number().nonnegative().optional(),
  // Pago parcial recibido por transferencia/depósito.
  receivedAmount: z.coerce.number().nonnegative().optional(),
  receivedCurrencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  receivedExchangeRate: z.coerce.number().positive().optional(),
  receivedPaymentMethod: z.nativeEnum(paymentMethodEnum).optional(),
  receivedReference: z.string().max(100).optional(),
  receivedBankAccountId: z.string().uuid().optional(),
  receivedAt: z.coerce.date().optional(),
  allowWithActiveLoanOrCredit: z.boolean().optional().default(false),
  allowWithPayrollCredit: z.boolean().optional().default(false),
  allowEarlyWithdrawal: z.boolean().optional().default(false),
  allowExceedAvailableBalance: z.boolean().optional().default(false),
  // Vinculación con el origen (p. ej. crédito como método de pago).
  originType: z.string().optional(),
  creditId: z.string().uuid().optional(),
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
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: z.string().optional(),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export const BulkWithdrawalAssociateSchema = z.object({
  tenantId: z.string().uuid().optional(),
});

export type CreateWithdrawalAssociateDto = z.infer<
  typeof CreateWithdrawalAssociateSchema
>;
export type DisburseWithdrawalAssociateDto = z.infer<
  typeof DisburseWithdrawalAssociateSchema
>;
export type FilterWithdrawalAssociateDto = z.infer<
  typeof FilterWithdrawalAssociateSchema
>;
export type BulkWithdrawalAssociateDto = z.infer<
  typeof BulkWithdrawalAssociateSchema
>;
