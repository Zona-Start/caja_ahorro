import { z } from 'zod';

import {
  ASSOCIATE_MOVEMENT_TYPES,
  AssociateMovementType,
} from './individual-load-options';

// Esquema de validación para el formulario
export const formSchema = z.object({
  associateAccountId: z
    .number({
      required_error: 'Debe seleccionar un asociado',
    })
    .optional(),
  movementType: z.enum(
    Object.keys(ASSOCIATE_MOVEMENT_TYPES) as [
      AssociateMovementType,
      ...AssociateMovementType[],
    ],
  ),
  amount: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo')
    .optional(),
  employerAmount: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo')
    .optional(),
  associateAmount: z.coerce
    .number()
    .min(0, 'El monto no puede ser negativo')
    .optional(),
  transactionDate: z.date({
    required_error: 'Debe seleccionar una fecha',
  }),
  description: z.string().min(1, 'Debe indicar una descripción'),
  bankAccountId: z.number().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  includeBankingDetails: z.boolean().default(false).optional(),
}).superRefine((data, ctx) => {
  if (data.movementType === 'EMPLOYER_CONTRIBUTION') {
    if (!data.employerAmount || data.employerAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe ser mayor a 0',
        path: ['employerAmount'],
      });
    }
    if (!data.associateAmount || data.associateAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe ser mayor a 0',
        path: ['associateAmount'],
      });
    }
  } else {
    if (!data.amount || data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El monto debe ser mayor a 0',
        path: ['amount'],
      });
    }
  }
});

export type LoadAssest = z.infer<typeof formSchema>;
