import { z } from 'zod';
import { INVOICE_STATUS, PAYMENT_TYPE, LINE_TYPE } from './supplier-invoice-options';

export const DOCUMENT_TYPE = {
  INVOICE: 'INVOICE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVOICE: 'Factura',
  CREDIT_NOTE: 'Nota de Crédito',
  DEBIT_NOTE: 'Nota de Débito',
};

const optionalString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().optional(),
);

export const invoiceItemFormSchema = z.object({
  lineType: z.nativeEnum(LINE_TYPE, {
    errorMap: () => ({ message: 'El tipo de línea es requerido' }),
  }),
  itemId: z.string().optional().nullable(),
  expenseAccountId: z.string().optional().nullable(),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unitCost: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0, 'El costo unitario no puede ser negativo'),
  ),
  totalLine: z.coerce.number().min(0, 'El total no puede ser negativo'),
});

export type InvoiceItemForm = z.infer<typeof invoiceItemFormSchema>;

export const supplierInvoiceBaseSchema = z.object({
  documentType: z.nativeEnum(DOCUMENT_TYPE).default('INVOICE'),
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  purchaseOrderId: z.string().optional().nullable(),
  inventoryMovementId: z.string().optional().nullable(),
  invoiceNumber: z.string().min(1, 'El número de factura es requerido'),
  controlNumber: z.string().optional(),
  invoiceDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha de factura es requerida' }) }),
  dueDate: z.coerce.date().optional().nullable(),
  subtotal: z.coerce.number().min(0, 'El subtotal no puede ser negativo'),
  taxAmount: z.coerce.number().min(0, 'El impuesto no puede ser negativo'),
  totalAmount: z.coerce.number().min(0, 'El total no puede ser negativo'),
  paymentType: z.nativeEnum(PAYMENT_TYPE, {
    errorMap: () => ({ message: 'El tipo de pago es requerido' }),
  }),
  status: z.nativeEnum(INVOICE_STATUS).default('DRAFT'),
  observations: optionalString,
  items: z.array(invoiceItemFormSchema).min(1, 'Debe agregar al menos un ítem'),
  currencyCode: z.string().optional(),
  paymentMethod: z.string().optional(),
  bankAccountId: z.string().optional().nullable(),
  bankReference: z.string().optional(),
});

export const supplierInvoiceFormSchema = supplierInvoiceBaseSchema.superRefine((data, ctx) => {
  if (data.paymentType === 'CREDIT') {
    if (!data.dueDate) {
      ctx.addIssue({ code: 'custom', message: 'La fecha de vencimiento es requerida para pagos a crédito', path: ['dueDate'] });
    }
  }
});

export type SupplierInvoiceForm = z.infer<typeof supplierInvoiceFormSchema>;

export const supplierInvoiceSchema = supplierInvoiceBaseSchema.extend({
  id: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierInvoice = z.infer<typeof supplierInvoiceSchema>;

export const supplierInvoiceMutationSchema = supplierInvoiceFormSchema;

export type SupplierInvoiceMutation = z.infer<typeof supplierInvoiceMutationSchema>;

export const creditNoteFormSchema = z.object({
  documentType: z.literal('CREDIT_NOTE').default('CREDIT_NOTE'),
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  accountsPayableId: z.string().optional().nullable(),
  creditNoteNumber: z.string().optional(),
  reason: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  notesDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha es requerida' }) }),
  observations: optionalString,
  returnItems: z
    .array(
      z.object({
        itemId: z.string().min(1),
        itemType: z.enum(['PRODUCT', 'FIXED_ASSET']),
        quantity: z.coerce.number().min(0.01),
        unitCost: z.coerce.number().min(0),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type CreditNoteForm = z.infer<typeof creditNoteFormSchema>;

export const debitNoteFormSchema = z.object({
  documentType: z.literal('DEBIT_NOTE').default('DEBIT_NOTE'),
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  accountsPayableId: z.string().optional().nullable(),
  debitNoteNumber: z.string().optional(),
  reason: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  notesDate: z.coerce.date({ errorMap: () => ({ message: 'La fecha es requerida' }) }),
  observations: optionalString,
});

export type DebitNoteForm = z.infer<typeof debitNoteFormSchema>;
