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

export type CreateSupplierInvoiceDto = z.infer<typeof CreateSupplierInvoiceSchema>;
export type FilterSupplierInvoiceDto = z.infer<typeof FilterSupplierInvoiceSchema>;
export type UpdateSupplierInvoiceDto = z.infer<typeof UpdateSupplierInvoiceSchema>;
