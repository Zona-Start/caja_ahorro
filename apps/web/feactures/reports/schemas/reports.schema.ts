import { z } from 'zod';

export const ReportDebtSchema = z.object({
  startDate: z.date({
    required_error: 'La fecha de inicio es requerida.',
  }),
  endDate: z.date({
    required_error: 'La fecha de fin es requerida.',
  }),
});

export type ReportDebtValues = z.infer<typeof ReportDebtSchema>;
