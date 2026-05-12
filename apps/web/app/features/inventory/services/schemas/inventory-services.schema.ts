import { z } from 'zod';
import { InventoryServiceStatus } from './inventory-services-options';

export const inventoryServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  supplierCost: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  otherCosts: z.coerce.number().min(0).default(0),
  purchaseTax: z.coerce.number().min(0).default(0),
  status: z.nativeEnum(InventoryServiceStatus).default(InventoryServiceStatus.ACTIVE),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InventoryService = z.infer<typeof inventoryServiceSchema>;
