import { z } from 'zod';
import { AssociateMovementTypeEnum, paymentMethodEnum } from '@/types/enum';

export const CreateIndividualLoadSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateAccountId: z.string().uuid(),
  movementType: z.nativeEnum(AssociateMovementTypeEnum),
  amount: z.number().nonnegative().optional(),
  employerAmount: z.number().nonnegative().optional(),
  associateAmount: z.number().nonnegative().optional(),
  transactionDate: z.coerce.date().optional(),
  description: z.string().optional(),
  bankAccountId: z.string().uuid().optional().nullable(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional(),
  referenceNumber: z.string().optional().nullable(),
});

export type CreateIndividualLoadDto = z.infer<typeof CreateIndividualLoadSchema>;

export const BulkIndividualLoadSchema = z.object({
  tenantId: z.string().uuid().optional(),
  transactionDate: z.coerce.date().optional(),
  description: z.string().optional(),
  bankAccountId: z.string().uuid().optional().nullable(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export type BulkIndividualLoadDto = z.infer<typeof BulkIndividualLoadSchema>;
