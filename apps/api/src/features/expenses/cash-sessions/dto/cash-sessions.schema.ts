import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OpenCashSessionSchema = z.object({
  cashRegisterId: z.string().uuid('La caja registradora es requerida'),
  initialBalance: z.coerce
    .number()
    .min(0, 'El saldo inicial no puede ser negativo'),
});
export class OpenCashSessionDto extends createZodDto(OpenCashSessionSchema) {}

export const CloseCashSessionSchema = z.object({
  actualPhysicalBalance: z.coerce
    .number()
    .min(0, 'El conteo físico no puede ser negativo'),
  notes: z.string().optional(),
});
export class CloseCashSessionDto extends createZodDto(CloseCashSessionSchema) {}

export const FilterCashSessionSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  cashRegisterId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
});
export class FilterCashSessionDto extends createZodDto(
  FilterCashSessionSchema,
) {}
