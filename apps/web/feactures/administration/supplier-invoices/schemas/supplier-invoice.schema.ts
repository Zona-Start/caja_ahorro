import { z } from 'zod';
import { purchaseItemTypeEnum, SupplierInvoicePaymentTypeEnum, SupplierInvoiceStatusEnum } from './supplier-invoice-options';

export const supplierInvoiceItemSchema = z.object({
  id: z.number().optional(),
  lineType: z.nativeEnum(purchaseItemTypeEnum),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().min(0, 'El costo unitario no puede ser negativo'),
  totalLine: z.coerce.number().min(0, 'El total de línea no puede ser negativo'),
  productId: z.number().optional().nullable(),
  fixedAssetId: z.number().optional().nullable(),
  expenseAccountId: z.number().optional().nullable(),
});

export const supplierInvoiceSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number({ required_error: 'Proveedor requerido' }),
  purchaseOrderId: z.number().optional().nullable(),
  invoiceNumber: z.string().min(1, 'Número de factura requerido'),
  controlNumber: z.string().optional().nullable(),
  invoiceDate: z.date({ required_error: 'Fecha de factura requerida' }),
  dueDate: z.date().optional().nullable(),
  subtotal: z.coerce.number().min(0, 'El subtotal no puede ser negativo'),
  taxAmount: z.coerce.number().optional().nullable(),
  totalAmount: z.coerce.number().min(0, 'El monto total no puede ser negativo'),
  currencyCode: z.string().min(1, 'Código de moneda requerido'),
  paymentType: z.nativeEnum(SupplierInvoicePaymentTypeEnum).default(SupplierInvoicePaymentTypeEnum.CREDIT),
  status: z.nativeEnum(SupplierInvoiceStatusEnum).default(SupplierInvoiceStatusEnum.OPEN),
  observations: z.string().optional().nullable(),
  items: z.array(supplierInvoiceItemSchema).min(1, 'Debe haber al menos un item'),
});

export type SupplierInvoice = z.infer<typeof supplierInvoiceSchema>;
export type SupplierInvoiceItem = z.infer<typeof supplierInvoiceItemSchema>;
