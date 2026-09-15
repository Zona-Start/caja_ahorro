import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCashMovementSchema = z.object({
  sessionId: z.string().uuid('La sesión de caja es requerida'),
  type: z.enum(['INFLOW', 'OUTFLOW']),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  concept: z.string().min(1, 'El concepto es requerido'),
  referenceType: z
    .enum([
      'EXPENSE',
      'SALE',
      'MANUAL_ADJUSTMENT',
      'PETTY_CASH_REPLENISHMENT',
      'PETTY_CASH_DISBURSEMENT',
      'CASH_OPENING',
      'CASH_CLOSING',
    ])
    .optional(),
});
export class CreateCashMovementDto extends createZodDto(
  CreateCashMovementSchema,
) {}

export const FilterCashMovementSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sessionId: z.string().uuid().optional(),
  type: z.enum(['INFLOW', 'OUTFLOW']).optional(),
});
export class FilterCashMovementDto extends createZodDto(
  FilterCashMovementSchema,
) {}
