import { z } from 'zod';
import { PaymentMethodEnum, SupplierTransactionStatusEnum, SupplierTransactionTypeEnum } from './supplier-transaction-options';

export const supplierTransactionSchema = z.object({
  id: z.number().optional(),
  accountsPayableId: z.number({ required_error: 'ID de cuenta por pagar requerido' }),
  transactionType: z.nativeEnum(SupplierTransactionTypeEnum),
  transactionDate: z.date({ required_error: 'Fecha de transacción requerida' }),
  amount: z.coerce.number().min(0, 'El monto no puede ser negativo'),
  currencyCode: z.string().min(1, 'Código de moneda requerido'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).optional().nullable(),
  reference: z.string().optional().nullable(),
  status: z.nativeEnum(SupplierTransactionStatusEnum).default(SupplierTransactionStatusEnum.ACTIVE),
});

export type SupplierTransaction = z.infer<typeof supplierTransactionSchema>;
