import { z } from 'zod';
import {
  PaymentMethodEnum,
  purchaseItemTypeEnum,
  SupplierInvoicePaymentTypeEnum,
  SupplierInvoiceStatusEnum,
} from './supplier-invoice-options';

export const supplierInvoiceItemSchema = z
  .object({
    id: z.number().optional(),
    lineType: z.nativeEnum(purchaseItemTypeEnum),
    description: z.string().optional().nullable(), // Now optional
    quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
    unitCost: z.coerce
      .number()
      .positive('El costo unitario debe ser mayor a 0'),
    totalLine: z.coerce
      .number()
      .min(0, 'El total de línea no puede ser negativo'),
    itemId: z.number().optional().nullable(),
    expenseAccountId: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const { lineType, itemId, description } = data;

    if (
      lineType === purchaseItemTypeEnum.SALES_INVENTORY ||
      lineType === purchaseItemTypeEnum.FIXED_ASSET ||
      lineType === purchaseItemTypeEnum.SERVICE
    ) {
      if (!itemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar un elemento.',
          path: ['itemId'],
        });
      }
    }

    if (lineType === purchaseItemTypeEnum.EXPENSE) {
      if (!description || description.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La descripción es requerida.',
          path: ['description'],
        });
      }
    }

    if (lineType === purchaseItemTypeEnum.SERVICE_EXPENSE) {
      if (!itemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe seleccionar un servicio.',
          path: ['itemId'],
        });
      }
    }
  });

export const supplierInvoiceSchema = z
  .object({
    id: z.number().optional(),
    supplierId: z.number({ required_error: 'El proveedor es requerido' }),
    supplierName: z.string().optional(),
    purchaseOrderId: z.number().optional().nullable(),
    invoiceNumber: z.string().min(1, 'El número de factura es requerido'),
    controlNumber: z.string().optional().nullable(),
    invoiceDate: z.date(),
    dueDate: z.date().nullable(),
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
    paymentAmount: z.coerce.number().optional().nullable(),
    paymentMethod: z.nativeEnum(PaymentMethodEnum).optional().nullable(),
    draftAppliedCredits: z
      .array(
        z.object({
          advanceId: z.number(),
          amount: z.coerce.number(),
        }),
      )
      .optional(),
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
      if (!data.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: 'El método de pago es requerido',
        });
      }
    }
  });

export type SupplierInvoice = z.infer<typeof supplierInvoiceSchema>;
export type SupplierInvoiceItem = z.infer<typeof supplierInvoiceItemSchema>;
