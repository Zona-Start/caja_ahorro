import { z } from 'zod';
import {
  ASSOCIATE_MOVEMENT_TYPES,
  type AssociateMovementType,
} from './individual-load-options';

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
  bankAccountId: z.number({
    required_error: 'Debe seleccionar una cuenta bancaria',
  }),
  paymentMethod: z.string({
    required_error: 'Debe seleccionar un método de pago',
  }),
  referenceNumber: z.string({
    required_error: 'Debe indicar un número de referencia',
  }).min(1, 'Debe indicar un número de referencia'),
  includeBankingDetails: z.boolean().default(true),
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

export const bulkFormSchema = z.object({
  bankAccountId: z.number({
    required_error: 'Debe seleccionar una cuenta bancaria',
  }).optional(),
  paymentMethod: z.string({
    required_error: 'Debe seleccionar un método de pago',
  }).optional(),
  referenceNumber: z.string({
    required_error: 'Debe indicar un número de referencia',
  }).min(1, 'Debe indicar un número de referencia').optional(),
  transactionDate: z.date({
    required_error: 'Debe seleccionar una fecha de transacción',
  }),
  description: z.string().optional(),
});

export type BulkLoadAsset = z.infer<typeof bulkFormSchema>;
