import { z } from 'zod';

const emptyStrToUndef = (v: unknown) =>
  v === '' || v == null ? undefined : v;

export const PurchaseOrderItemSchema = z.object({
  lineType: z.enum([
    'SALES_INVENTORY',
    'FIXED_ASSET',
    'SERVICE',
    'EXPENSE',
    'SERVICE_EXPENSE',
  ]),
  productId: z.preprocess(emptyStrToUndef, z.string().uuid().optional()),
  itemId: z.preprocess(emptyStrToUndef, z.string().uuid().optional()),
  description: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number(),
  totalCost: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  if (data.lineType === 'SALES_INVENTORY' && !data.productId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'productId es requerido para SALES_INVENTORY',
      path: ['productId'],
    });
  }
  if (
    (data.lineType === 'SERVICE' ||
      data.lineType === 'SERVICE_EXPENSE' ||
      data.lineType === 'FIXED_ASSET') &&
    !data.itemId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `itemId es requerido para ${data.lineType}`,
      path: ['itemId'],
    });
  }
  if (data.lineType === 'EXPENSE' && !data.description) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'description es requerida para EXPENSE',
      path: ['description'],
    });
  }
});

export const CreatePurchaseOrderSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid(),
  orderDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().optional(),
  status: z.string().optional(),
  subtotal: z.coerce.number(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  currencyCode: z.string().optional(),
  observations: z.string().optional(),
  items: z.array(PurchaseOrderItemSchema).min(1),
});

export const FilterPurchaseOrderSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.string().optional().default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const FindAllForInvoiceSchema = z.object({
  supplierId: z.string().uuid(),
  status: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (typeof v === 'string' ? v.split(',') : v))
    .optional(),
});

export const UpdatePurchaseOrderSchema = z.object({
  tenantId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  orderDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  status: z.string().optional(),
  subtotal: z.coerce.number().optional(),
  taxAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  currencyCode: z.string().optional(),
  observations: z.string().optional(),
  items: z.array(PurchaseOrderItemSchema).optional(),
});

export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;
export type FilterPurchaseOrderDto = z.infer<typeof FilterPurchaseOrderSchema>;
export type FindAllForInvoiceDto = z.infer<typeof FindAllForInvoiceSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof UpdatePurchaseOrderSchema>;
