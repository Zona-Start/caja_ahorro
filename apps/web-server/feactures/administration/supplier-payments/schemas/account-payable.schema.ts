import { z } from 'zod';

//schema en formulario para pagar un cuenta por pagar
export const paymentAccountPayableSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({
    required_error: 'ID de proveedor requerido',
  }),
  supplierName: z.string().optional(),
  accountsPayableNumber: z.string().optional(),
  amount: z.coerce.number().min(0, 'El monto original no puede ser negativo'),
  paidAmount: z.coerce
    .number()
    .min(0, 'El monto pagado no puede ser negativo')
    .optional()
    .nullable(),
  remainingAmount: z.coerce
    .number()
    .min(0, 'El monto restante no puede ser negativo'),
  invoiceNumber: z.string().optional(),
});

export const noteDebitSchema = z
  .array(
    z.object({
      id: z.number().optional(),
      referenceNote: z.string().optional(),
      appliedAmount: z.string().optional(),
    }),
  )
  .optional()
  .nullable();

export type PaymentAccountPayable = z.infer<typeof paymentAccountPayableSchema>;
export type PaymentAccountPayableNote = z.infer<typeof noteDebitSchema>;
