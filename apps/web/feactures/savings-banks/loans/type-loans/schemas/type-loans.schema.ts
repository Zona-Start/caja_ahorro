import { z } from 'zod';

export const typeLoanSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: 'Nombre es requerido' }),
  description: z.string().optional(),
  interestRateAnnual: z.number({ message: 'Requerido' }).min(1),
  maxLoanAmount: z.number().optional().nullable(),
  minLoanAmount: z.number().optional().nullable(),
  termMonthsMin: z.number({ message: 'Requerido' }).min(1),
  termMonthsMax: z.number({ message: 'Requerido' }).min(1),
});

export type TypeLoan = z.infer<typeof typeLoanSchema>;
