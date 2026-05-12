import { z } from 'zod';

export const GenerateOpeningEntrySchema = z.object({
  currentBalance: z.coerce.number(),
  accountingRuleId: z.string().uuid(),
  openingDate: z.coerce.date(),
});

export type GenerateOpeningEntryDto = z.infer<typeof GenerateOpeningEntrySchema>;
