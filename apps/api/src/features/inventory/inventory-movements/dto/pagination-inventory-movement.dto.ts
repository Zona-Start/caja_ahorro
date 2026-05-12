import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@/common/dto/pagination.dto';

export const InventoryMovementPaginationSchema = PaginationSchema.extend({
  itemId: z.string().uuid().optional(),
  itemType: z.enum(['PRODUCT', 'FIXED_ASSET']).optional(),
  movementType: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
});

export class InventoryMovementPaginationDto extends createZodDto(InventoryMovementPaginationSchema) {}
