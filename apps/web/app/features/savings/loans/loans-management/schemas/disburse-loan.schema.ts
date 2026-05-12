import { z } from 'zod';

export const disburseIndividualLoanSchema = z.object({
  loanId: z.number(),
  bankAccountId: z.string().min(1, 'La cuenta bancaria es requerida'),
  currencyCode: z.string().min(1, 'La moneda es requerida'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  disbursementDate: z.date({
    required_error: 'La fecha de desembolso es requerida',
  }),
  bankReference: z.string().optional(),
  description: z.string().optional(),
});

export type DisburseIndividualLoan = z.infer<
  typeof disburseIndividualLoanSchema
>;
