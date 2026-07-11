import { z } from 'zod';

const ItemSchema = z.object({
  lineType: z.string(),
  itemId: z.number().int().positive().optional(),
  expenseAccountId: z.string().uuid().optional(),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
  totalLine: z.coerce.number().nonnegative(),
});

export const CreateSupplierInvoiceSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  invoiceNumber: z.string(),
  controlNumber: z.string().optional(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  subtotal: z.coerce.number(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  paymentType: z.string().optional(),
  status: z.string().optional(),
  observations: z.string().optional(),
  items: z.array(ItemSchema).optional(),
  currencyCode: z.string().optional(),
  paymentMethod: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  bankReference: z.string().optional(),
});

export const FilterSupplierInvoiceSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.string().optional().default('asc'),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const UpdateSupplierInvoiceSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  controlNumber: z.string().optional(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  subtotal: z.coerce.number().optional(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  paymentType: z.string().optional(),
  status: z.string().optional(),
  observations: z.string().optional(),
  items: z.array(ItemSchema).optional(),
});

export type CreateSupplierInvoiceDto = z.infer<
  typeof CreateSupplierInvoiceSchema
>;
export type FilterSupplierInvoiceDto = z.infer<
  typeof FilterSupplierInvoiceSchema
>;
export type UpdateSupplierInvoiceDto = z.infer<
  typeof UpdateSupplierInvoiceSchema
>;

export const CreateCreditNoteSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  accountsPayableId: z.string().uuid().optional(),
  reason: z.string().min(3),
  amount: z.coerce.number().positive(),
  taxAmount: z.coerce.number().optional().default(0),
  observations: z.string().optional(),
  creditNoteNumber: z.string(),
  notesDate: z.coerce.date(),
  returnItems: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        itemType: z.enum(['PRODUCT', 'FIXED_ASSET']),
        quantity: z.number().int().positive(),
        unitCost: z.coerce.number().nonnegative(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export const CreateDebitNoteSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  accountsPayableId: z.string().uuid().optional(),
  reason: z.string().min(3),
  amount: z.coerce.number().positive(),
  taxAmount: z.coerce.number().optional().default(0),
  observations: z.string().optional(),
  debitNoteNumber: z.string(),
  notesDate: z.coerce.date(),
});

export const VoidInvoiceSchema = z.object({
  reason: z.string().min(3),
});

export const StatusTransitionSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'CANCELLED']),
});

export type CreateCreditNoteDto = z.infer<typeof CreateCreditNoteSchema>;
export type CreateDebitNoteDto = z.infer<typeof CreateDebitNoteSchema>;
export type VoidInvoiceDto = z.infer<typeof VoidInvoiceSchema>;
export type StatusTransitionDto = z.infer<typeof StatusTransitionSchema>;
