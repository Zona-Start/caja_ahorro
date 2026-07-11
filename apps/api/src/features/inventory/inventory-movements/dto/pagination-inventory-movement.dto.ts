import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InventoryMovementPaginationSchema = PaginationSchema.extend({
  movementType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().date().or(z.string().datetime()).optional(),
  endDate: z.string().date().or(z.string().datetime()).optional(),
  productId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
});

export class InventoryMovementPaginationDto extends createZodDto(
  InventoryMovementPaginationSchema,
) {}
