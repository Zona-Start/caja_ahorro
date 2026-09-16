import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeliveryNoteItemSchema = z.object({
  productId: z.string().uuid('Producto inválido'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
});

export const CreateDeliveryNoteSchema = z.object({
  tenantId: z.string().uuid().optional(),
  customerId: z.string().uuid('El cliente es requerido'),
  invoiceId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(DeliveryNoteItemSchema)
    .min(1, 'Debe agregar al menos un producto'),
});
export class CreateDeliveryNoteDto extends createZodDto(
  CreateDeliveryNoteSchema,
) {}

export const FilterDeliveryNoteSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'DISPATCHED', 'INVOICED', 'CANCELLED']).optional(),
});
export class FilterDeliveryNoteDto extends createZodDto(
  FilterDeliveryNoteSchema,
) {}
