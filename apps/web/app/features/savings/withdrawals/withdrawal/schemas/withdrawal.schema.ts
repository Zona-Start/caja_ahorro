import { z } from 'zod';
import { paymentMethodEnum } from './withdrawal-options';

export const withdrawalSchema = z.object({
  associateAccountId: z.string().min(1, 'La cuenta del asociado es requerida'),
  withdrawalTypeId: z.string().min(1, 'Seleccione un tipo de retiro'),
  requestedAmount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: paymentMethodEnum,
  date: z.coerce.date(),
  description: z.string().optional(),
  commercialHouseId: z.string().optional().nullable(),
  // Moneda y tasa únicas para todos los productos del retiro.
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  exchangeRate: z.coerce.number().positive().optional(),
  goodsTotalAmount: z.coerce.number().nonnegative().optional(),
  // Pago parcial recibido por transferencia/depósito.
  receivedAmount: z.coerce.number().nonnegative().optional(),
  receivedCurrencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  receivedExchangeRate: z.coerce.number().positive().optional(),
  receivedPaymentMethod: paymentMethodEnum.optional(),
  receivedReference: z.string().optional(),
  receivedBankAccountId: z.string().optional(),
  receivedAt: z.coerce.date().optional(),
  allowWithActiveLoanOrCredit: z.boolean().optional().default(false),
  allowWithPayrollCredit: z.boolean().optional().default(false),
  allowEarlyWithdrawal: z.boolean().optional().default(false),
  allowExceedAvailableBalance: z.boolean().optional().default(false),
  withdrawalItems: z
    .array(
      z.object({
        itemType: z.enum(['PRODUCT', 'SERVICE', 'EXTERNAL']),
        itemDescription: z.string().optional().nullable(),
        itemId: z.string().optional().nullable(),
        itemName: z.string().optional().nullable(),
        quantity: z.number().positive('La cantidad debe ser al menos 1'),
        agreedSellingPrice: z.number().min(0, 'El precio no puede ser negativo'),
        days: z.string().optional().nullable(),
        specialDayCategoryId: z.string().optional(),
        currencyCode: z.enum(['VES', 'USD', 'EUR']).optional().nullable(),
        exchangeRate: z.coerce.number().positive().optional().nullable(),
        originalUnitPrice: z.coerce.number().min(0).optional().nullable(),
        unitPriceBase: z.coerce.number().min(0).optional().nullable(),
        totalBase: z.coerce.number().min(0).optional().nullable(),
      }),
    )
    .optional(),
});

export type Withdrawal = z.infer<typeof withdrawalSchema>;
