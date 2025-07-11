import { z } from 'zod';

// Si tienes enums definidos en tu front para currencyCode y status, puedes reemplazar los string() por z.enum([...])
export const invoicesPayableSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'Proveedor requerido' }),
  invoiceNumber: z
    .string()
    .min(1, { message: 'Número de factura requerido' })
    .max(100, {
      message: 'Máximo 100 caracteres',
    }),
  invoiceDate: z.date({ required_error: 'Fecha de factura requerida' }),
  dueDate: z.date({ required_error: 'Fecha de vencimiento requerida' }),
  totalAmount: z.coerce
    .number({
      required_error: 'Monto total requerido',
    })
    .min(0, 'El monto debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El monto debe ser un número válido',
    }),
  concept: z.string().min(1, { message: 'Concepto requerido' }),
  status: z.string().optional(), // Puedes reemplazar por z.enum([...])
  observations: z.string().optional(),
});

export type InvoicesPayable = z.infer<typeof invoicesPayableSchema>;
