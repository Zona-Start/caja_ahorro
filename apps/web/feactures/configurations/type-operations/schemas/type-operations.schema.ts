import { z } from 'zod';

export const typeOperationsSchema = z.object({
  id: z.number().optional(),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(5, 'El código no puede tener más de 5 números')
    .regex(/^[\d]+$/, 'El código debe contener solo números'),
  description: z.string().min(5, 'La descripción es requerida'),
  deferredDate: z.date().nullable(),
  dateCanceled: z.date().nullable(),
  deferredNumber: z.number().nullable(),
  numberCanceled: z.number().nullable(),
  group: z.string().min(1, { message: 'campo requerido' }),
  metadata: z.any().nullable(),
  associatedAccount: z.number().nullable(),
  employerAccount: z.number().nullable(),
  loanAccount: z.number().nullable(),
});

export type TypeOperations = z.infer<typeof typeOperationsSchema>;
