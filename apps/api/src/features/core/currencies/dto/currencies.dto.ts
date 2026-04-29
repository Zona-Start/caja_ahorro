import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCurrencySchema = z.object({
  code: z.enum(['VES', 'USD', 'EUR']),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(5),
  isBase: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  decimalPlaces: z.number().int().min(0).optional().default(2),
});

export const UpdateCurrencySchema = CreateCurrencySchema.partial();

export class CreateCurrencyDto extends createZodDto(CreateCurrencySchema) {}
export class UpdateCurrencyDto extends createZodDto(UpdateCurrencySchema) {}

export const CurrencyQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

export class CurrencyQueryDto extends createZodDto(CurrencyQuerySchema) {}
