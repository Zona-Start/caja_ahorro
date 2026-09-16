import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SaleItemSchema = z.object({
  productId: z.string().uuid('Producto inválido'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  /** Gross unit price (tax included) charged to the customer. */
  unitPrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(16),
  /** Average cost snapshot used for margin reporting. */
  unitCost: z.coerce.number().min(0).optional().default(0),
});

export const CreateSaleSchema = z
  .object({
    tenantId: z.string().uuid().optional(),
    customerId: z.string().uuid('El cliente es requerido'),
    saleType: z.enum(['CASH', 'CREDIT']).default('CASH'),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(500).optional(),
    paymentMethod: z
      .enum(['CASH', 'CARD', 'TRANSFER', 'OTHER'])
      .optional()
      .default('CASH'),
    /** Required when paymentMethod is CASH so the drawer is updated. */
    cashRegisterSessionId: z.string().uuid().optional(),
    paymentReference: z.string().max(100).optional(),
    createDeliveryNote: z.boolean().optional().default(false),
    items: z.array(SaleItemSchema).min(1, 'Debe agregar al menos un producto'),
  })
  .superRefine((data, ctx) => {
    if (data.saleType === 'CREDIT' && !data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de vencimiento es requerida para ventas a crédito',
        path: ['dueDate'],
      });
    }
  });

export class CreateSaleDto extends createZodDto(CreateSaleSchema) {}

export const FilterSaleSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: z
    .enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'])
    .optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export class FilterSaleDto extends createZodDto(FilterSaleSchema) {}
