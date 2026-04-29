import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GenerateOpeningEntrySchema = z.object({
  currentBalance: z.number().describe('Saldo inicial de la cuenta bancaria'),

  accountingRuleId: z
    .number()
    .describe('ID de la regla contable para el asiento de apertura'),

  openingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Formato de fecha inválido (ISO 8601 esperado)',
    })
    .describe('Fecha del asiento de apertura (YYYY-MM-DD)'),
});

export class GenerateOpeningEntryDto extends createZodDto(
  GenerateOpeningEntrySchema,
) {}
