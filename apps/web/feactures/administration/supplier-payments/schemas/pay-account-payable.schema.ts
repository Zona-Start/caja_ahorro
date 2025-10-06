import { z } from 'zod';
import { PaymentMethodEnum } from '../../supplier-payments/schemas/supplier-payment-options';

export const appliedCreditSchema = z.object({
  cxpId: z.number(),
  amount: z.coerce.number().positive('El monto a aplicar debe ser positivo'),
  origin: z.string(),
  cxpNumber: z.string(),
});

export const payAccountPayableSchema = z.object({
  // FKs and identifiers
  supplierId: z.number(),
  supplierName: z.string().optional(),
  accountsPayableId: z.number(),

  // Form fields
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  paymentDescription: z.string().min(1, 'La descripción es obligatoria.'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  amount: z.coerce.number(),
  appliedCredits: z.array(appliedCreditSchema).optional(),
  status: z.string().optional(),
});

export const payAdvanceSchema = z.object({
  // FKs and identifiers
  supplierId: z.number(),
  supplierName: z.string().optional(),
  transactionId: z.number(),

  // Form fields
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  paymentDescription: z.string().min(1, 'La descripción es obligatoria.'),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  amount: z.coerce.number(),
});

export type PayAccountPayable = z.infer<typeof payAccountPayableSchema>;
export type PayAdvance = z.infer<typeof payAdvanceSchema>;
export type AppliedCredit = z.infer<typeof appliedCreditSchema>;

//schema del formulario de pagos de una cuenta por pagar para hook y action
export const payAccountPayableHookActionSchema = z.object({
  // FKs and identifiers
  supplierId: z.number(),
  supplierName: z.string().optional(),
  accountPayableId: z.number(),
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es obligatoria.',
  }),
  paymentDescription: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  bankReference: z.string().optional().nullable(),
  transactionDate: z.date(),
  amount: z.coerce.number(),
  creditAplied: z
    .array(
      z.object({
        id: z.number(),
        transactionType: z.string(),
        appliedAmount: z.number(),
      }),
    )
    .optional(),
});

export type PayAccountPayableHookAction = z.infer<
  typeof payAccountPayableHookActionSchema
>;
