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
    .positive('El monto debe ser positivo')
    .min(0.01, 'El monto debe ser mayor a 0'),
  currencyCode: z.string().min(1, 'Debe seleccionar una moneda'),
  transactionDate: z.date({
    required_error: 'Debe seleccionar una fecha',
  }),
  description: z.string().min(1, 'Debe indicar una descripción'),
  bankAccountId: z.number().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  exchangeRateId: z.number().optional(),
  includeBankingDetails: z.boolean().default(false).optional(),
});

export type LoadAssest = z.infer<typeof formSchema>;
