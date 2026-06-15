import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const InventoryMovementPaginationSchema = PaginationSchema.extend({
  productId: z.string().uuid().optional(),
  movementType: z.string().optional(),
});

export class InventoryMovementPaginationDto extends createZodDto(InventoryMovementPaginationSchema) {}
