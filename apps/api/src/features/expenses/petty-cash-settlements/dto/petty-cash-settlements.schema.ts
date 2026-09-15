import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OpenPettyCashSettlementSchema = z.object({
  fundId: z.string().uuid('El fondo fijo es requerido'),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El período debe tener formato YYYY-MM')
    .optional(),
});
export class OpenPettyCashSettlementDto extends createZodDto(
  OpenPettyCashSettlementSchema,
) {}

export const ClosePettyCashSettlementSchema = z.object({
  physicalCount: z.coerce
    .number()
    .min(0, 'El conteo físico no puede ser negativo'),
  replenishmentsTotal: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
});
export class ClosePettyCashSettlementDto extends createZodDto(
  ClosePettyCashSettlementSchema,
) {}

export const FilterPettyCashSettlementSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  fundId: z.string().uuid().optional(),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El período debe tener formato YYYY-MM')
    .optional(),
});
export class FilterPettyCashSettlementDto extends createZodDto(
  FilterPettyCashSettlementSchema,
) {}
