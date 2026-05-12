import { z } from 'zod';
import { INVOICE_STATUS, PAYMENT_TYPE, LINE_TYPE } from './supplier-invoice-options';

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

export const invoiceItemFormSchema = z.object({
  lineType: z.nativeEnum(LINE_TYPE, {
    errorMap: () => ({ message: 'El tipo de línea es requerido' }),
  }),
  itemId: z.coerce.number().optional().nullable(),
  expenseAccountId: z.coerce.number().optional().nullable(),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unitCost: z.coerce.number().min(0, 'El costo unitario no puede ser negativo'),
  totalLine: z.coerce.number().min(0, 'El total no puede ser negativo'),
});

export type InvoiceItemForm = z.infer<typeof invoiceItemFormSchema>;

export const supplierInvoiceFormSchema = z.object({
  supplierId: z.coerce.number().min(1, 'El proveedor es requerido'),
  purchaseOrderId: z.coerce.number().optional().nullable(),
  invoiceNumber: z.string().min(1, 'El número de factura es requerido'),
  controlNumber: z.string().optional(),
  invoiceDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha de factura es requerida' }) }),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha de vencimiento es requerida' }) }),
  subtotal: z.coerce.number().min(0, 'El subtotal no puede ser negativo'),
  taxAmount: z.coerce.number().min(0, 'El impuesto no puede ser negativo'),
  totalAmount: z.coerce.number().min(0, 'El total no puede ser negativo'),
  paymentType: z.nativeEnum(PAYMENT_TYPE, {
    errorMap: () => ({ message: 'El tipo de pago es requerido' }),
  }),
  status: z.nativeEnum(INVOICE_STATUS).default('DRAFT'),
  observations: optionalString,
  items: z.array(invoiceItemFormSchema).min(1, 'Debe agregar al menos un ítem'),
});

export type SupplierInvoiceForm = z.infer<typeof supplierInvoiceFormSchema>;

export const supplierInvoiceSchema = supplierInvoiceFormSchema.extend({
  id: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierInvoice = z.infer<typeof supplierInvoiceSchema>;

export const supplierInvoiceMutationSchema = supplierInvoiceFormSchema;

export type SupplierInvoiceMutation = z.infer<typeof supplierInvoiceMutationSchema>;
