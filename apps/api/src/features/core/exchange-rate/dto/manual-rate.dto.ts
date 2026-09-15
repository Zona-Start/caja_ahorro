import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ManualRateSchema = z.object({
  currencyCode: z.enum(['USD', 'EUR']),
  rate: z.coerce
    .number()
    .positive('La tasa debe ser un número positivo.')
    .max(999999.999999),
  rateDate: z.coerce.date().optional(),
});

export class ManualRateDto extends createZodDto(ManualRateSchema) {}
