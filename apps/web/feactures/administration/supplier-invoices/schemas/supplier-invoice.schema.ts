import { z } from 'zod';
import {
  purchaseItemTypeEnum,
  SupplierInvoicePaymentTypeEnum,
  SupplierInvoiceStatusEnum,
} from './supplier-invoice-options';

export const supplierInvoiceItemSchema = z
  .object({
    id: z.number().optional(),
    lineType: z.nativeEnum(purchaseItemTypeEnum),
    description: z.string().optional(), // Now optional
    quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
    unitCost: z.coerce
      .number()
      .min(0, 'El costo unitario no puede ser negativo'),
    totalLine: z.coerce
      .number()
      .min(0, 'El total de línea no puede ser negativo'),
    itemId: z.number().optional().nullable(),
    expenseAccountId: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Check if the lineType is EXPENSE
    if (data.lineType === purchaseItemTypeEnum.EXPENSE) {
      // If it is, check if the description is missing or empty
      if (!data.description || data.description.trim() === '') {
        // If the condition is met, add an issue to the context
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La descripción es requerida.',
          path: ['description'],
        });
      }
    }
  });

export const supplierInvoiceSchema = z
  .object({
    id: z.number().optional(),
    supplierId: z.number({ required_error: 'El proveedor es requerido' }),
    purchaseOrderId: z.number().optional().nullable(),
    invoiceNumber: z.string().min(1, 'El número de factura es requerido'),
    controlNumber: z.string().optional().nullable(),
    invoiceDate: z.date(),
    dueDate: z.date(),
    subtotal: z.number(),
    taxAmount: z.number(),
    totalAmount: z.number(),
    paymentType: z.nativeEnum(SupplierInvoicePaymentTypeEnum),
    status: z.nativeEnum(SupplierInvoiceStatusEnum).optional(),
    observations: z.string().optional().nullable(),
    items: z
      .array(supplierInvoiceItemSchema)
      .min(1, 'Debe haber al menos un item'),
    chargePayment: z.boolean().optional(),
    bankAccountId: z.number().optional().nullable(),
    transactionDate: z.date().optional().nullable(),
    paymentDescription: z.string().optional().nullable(),
    paymentBankReference: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.paymentType === SupplierInvoicePaymentTypeEnum.CREDIT &&
      !data.dueDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ['dueDate'],
        message: 'La fecha de vencimiento es requerida para facturas a crédito',
      });
    }

    if (data.chargePayment) {
      if (!data.bankAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bankAccountId'],
          message: 'La cuenta bancaria es requerida',
        });
      }
      if (!data.paymentDescription) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentDescription'],
          message: 'La descripción del pago es requerida',
        });
      }
    }
  });

export type SupplierInvoice = z.infer<typeof supplierInvoiceSchema>;
export type SupplierInvoiceItem = z.infer<typeof supplierInvoiceItemSchema>;
