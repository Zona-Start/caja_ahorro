import { AssociateMovementTypeEnum, paymentMethodEnum } from '@/types/enum';
import { z } from 'zod';

/**
 * Tipo de movimiento lógico aceptado por la carga individual.
 * `SAVING_DIFFERENCE` (Diferencia Aporte) se traduce internamente a un
 * movimiento `SAVING_CONTRIBUTION` con descripción específica y su asiento
 * contable apunta a la cuenta ASSOCIATED_SAVINGS.
 */
export const IndividualLoadMovementTypeSchema = z.union([
  z.nativeEnum(AssociateMovementTypeEnum),
  z.literal('SAVING_DIFFERENCE'),
]);
export type IndividualLoadMovementType = z.infer<
  typeof IndividualLoadMovementTypeSchema
>;

export const CreateIndividualLoadSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateAccountId: z.string().uuid(),
  movementType: IndividualLoadMovementTypeSchema,
  amount: z.number().nonnegative().optional(),
  employerAmount: z.number().nonnegative().optional(),
  associateAmount: z.number().nonnegative().optional(),
  transactionDate: z.coerce.date().optional(),
  description: z.string().optional(),
  bankAccountId: z.string().uuid().optional().nullable(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional(),
  referenceNumber: z.string().optional().nullable(),
});

export type CreateIndividualLoadDto = z.infer<
  typeof CreateIndividualLoadSchema
>;

export const BulkIndividualLoadSchema = z.object({
  tenantId: z.string().uuid().optional(),
  transactionDate: z.coerce.date().optional(),
  description: z.string().optional(),
  bankAccountId: z.string().uuid().optional().nullable(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export type BulkIndividualLoadDto = z.infer<typeof BulkIndividualLoadSchema>;
