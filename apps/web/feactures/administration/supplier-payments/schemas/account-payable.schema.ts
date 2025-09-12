import { z } from 'zod';
import { AccountPayableStatusEnum } from '../../accounts-payable/schemas/account-payable-options';

//schema en formulario para pagar un cuenta por pagar
export const paymentAccountPayableSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({
    required_error: 'ID de proveedor requerido',
  }),
  supplierName: z.string(),
  supplierInvoiceId: z.number({
    required_error: 'ID de factura de proveedor requerido',
  }),
  originalAmount: z.coerce
    .number()
    .min(0, 'El monto original no puede ser negativo'),
  paidAmount: z.coerce
    .number()
    .min(0, 'El monto pagado no puede ser negativo')
    .optional()
    .nullable(),
  remainingAmount: z.coerce
    .number()
    .min(0, 'El monto restante no puede ser negativo'),
  status: z
    .nativeEnum(AccountPayableStatusEnum)
    .default(AccountPayableStatusEnum.PENDING),
  observations: z.string().optional().nullable(),
  supplierInvoice: z
    .object({
      invoiceNumber: z.string(),
    })
    .optional()
    .nullable(),
});

export type PaymentAccountPayable = z.infer<typeof paymentAccountPayableSchema>;
