import { z } from 'zod';
import { AccountPayableStatusEnum } from './account-payable-options';

export const accountPayableSchema = z.object({
  id: z.number().optional(),
  supplierInvoiceId: z.number({ required_error: 'ID de factura de proveedor requerido' }),
  originalAmount: z.coerce.number().min(0, 'El monto original no puede ser negativo'),
  paidAmount: z.coerce.number().min(0, 'El monto pagado no puede ser negativo').optional().nullable(),
  remainingAmount: z.coerce.number().min(0, 'El monto restante no puede ser negativo'),
  currencyCode: z.string().min(1, 'Código de moneda requerido'),
  status: z.nativeEnum(AccountPayableStatusEnum).default(AccountPayableStatusEnum.PENDING),
  observations: z.string().optional().nullable(),
});

export type AccountPayable = z.infer<typeof accountPayableSchema>;
