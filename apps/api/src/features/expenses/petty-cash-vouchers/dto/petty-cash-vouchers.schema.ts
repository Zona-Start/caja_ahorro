import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePettyCashVoucherSchema = z.object({
  fundId: z.string().uuid('El fondo fijo es requerido'),
  beneficiaryName: z
    .string()
    .min(1, 'El beneficiario es requerido')
    .max(255, 'Máximo 255 caracteres'),
  amount: z.coerce.number().positive('El monto del vale debe ser mayor a cero'),
  concept: z.string().min(1, 'El concepto es requerido'),
  ticketImageUrl: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
});
export class CreatePettyCashVoucherDto extends createZodDto(
  CreatePettyCashVoucherSchema,
) {}

export const UpdatePettyCashVoucherSchema =
  CreatePettyCashVoucherSchema.partial();
export class UpdatePettyCashVoucherDto extends createZodDto(
  UpdatePettyCashVoucherSchema,
) {}

export const LiquidatePettyCashVoucherSchema = z.object({
  categoryId: z.string().uuid('La categoría de gasto es requerida'),
  description: z.string().max(255).optional(),
  receiptNumber: z.string().max(100).optional(),
});
export class LiquidatePettyCashVoucherDto extends createZodDto(
  LiquidatePettyCashVoucherSchema,
) {}

export const FilterPettyCashVoucherSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  fundId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'LIQUIDATED']).optional(),
  search: z.string().optional(),
});
export class FilterPettyCashVoucherDto extends createZodDto(
  FilterPettyCashVoucherSchema,
) {}
