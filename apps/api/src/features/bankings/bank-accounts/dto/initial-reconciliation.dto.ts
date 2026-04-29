import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InitialReconciliationSchema = z.object({
  createAdjustment: z.boolean().describe('Indica si se debe crear un ajuste'),

  bankAccountId: z.number().positive().describe('ID de la cuenta bancaria'),

  lastStatementBalance: z
    .number()
    .describe('Saldo del último estado de cuenta'),

  // z.coerce.date() intenta convertir automáticamente strings a objetos Date
  lastStatementDate: z.coerce
    .date()
    .describe('Fecha del último estado de cuenta'),

  reconciliationDate: z.coerce.date().describe('Fecha de la conciliación'),
});

export class InitialReconciliationDto extends createZodDto(
  InitialReconciliationSchema,
) {}
