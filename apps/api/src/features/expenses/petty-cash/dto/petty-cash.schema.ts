import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePettyCashFundSchema = z.object({
  name: z.string().min(1, 'El nombre del fondo es requerido').max(100),
  custodianUserId: z.string().uuid('El custodio es requerido'),
  assignedAmount: z.coerce
    .number()
    .positive('El monto asignado debe ser positivo'),
  currencyCode: z.enum(['VES', 'USD', 'EUR']),
  isActive: z.boolean().optional().default(true),
});
export class CreatePettyCashFundDto extends createZodDto(
  CreatePettyCashFundSchema,
) {}

export const UpdatePettyCashFundSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  custodianUserId: z.string().uuid().optional(),
  assignedAmount: z.coerce.number().positive().optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  isActive: z.boolean().optional(),
});
export class UpdatePettyCashFundDto extends createZodDto(
  UpdatePettyCashFundSchema,
) {}

export const FilterPettyCashFundSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});
export class FilterPettyCashFundDto extends createZodDto(
  FilterPettyCashFundSchema,
) {}

export const ReplenishPettyCashSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  concept: z.string().min(1, 'El concepto es requerido'),
});
export class ReplenishPettyCashDto extends createZodDto(
  ReplenishPettyCashSchema,
) {}

export const DisbursePettyCashSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  concept: z.string().min(1, 'El concepto es requerido'),
});
export class DisbursePettyCashDto extends createZodDto(
  DisbursePettyCashSchema,
) {}
