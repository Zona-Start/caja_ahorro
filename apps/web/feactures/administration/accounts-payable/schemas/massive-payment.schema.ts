import { z } from 'zod';
import { PaymentMethodEnum } from '../../supplier-payments/schemas/supplier-payment-options';
import { accountPayableSchema } from './account-payable.schema';

export const massivePaymentAccountSchema = accountPayableSchema.extend({
  selected: z.boolean(),
  amountToPay: z.coerce.number(),
  accountsPayableNumber: z.string().optional(),
  dueDate: z.string().optional(),
  supplierName: z.string().optional(),
  supplierId: z.number().optional(), // Add supplierId here
});

export const massivePaymentSchema = z.object({
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  paymentDescription: z.string().min(1, 'La descripción es obligatoria.'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  accounts: z.array(massivePaymentAccountSchema),
});

export type MassivePayment = z.infer<typeof massivePaymentSchema>;

export const massivePaymentApiSchema = z.object({
  bankAccountId: z.number(),
  paymentDescription: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  accounts: z.array(
    z.object({
      accountsPayableId: z.number(),
      amount: z.coerce.number(),
    }),
  ),
});

export type MassivePaymentAPI = z.infer<typeof massivePaymentApiSchema>;

export const CreateSupplierPaymentLineSchema = z.object({
  accountsPayableId: z.number(),
  amount: z.coerce.number(),
  description: z.string().optional(),
});

export const CreateSupplierPaymentDtoSchema = z.object({
  supplierId: z.number(),
  totalAmount: z.coerce.number(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankAccountId: z.number(),
  bankDescription: z.string().optional().nullable(),
  bankReference: z.string().optional().nullable(),
  bankTransactionDate: z.date(),
  observations: z.string().optional().nullable(),
  lines: z.array(CreateSupplierPaymentLineSchema),
});

export type CreateSupplierPaymentDto = z.infer<typeof CreateSupplierPaymentDtoSchema>;
