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
  bankAccountId: z.string().uuid(),
  paymentMethod: z.nativeEnum(paymentMethodEnum),
  referenceNumber: z.string().min(1),
});

export type CreateIndividualLoadDto = z.infer<typeof CreateIndividualLoadSchema>;

export const BulkIndividualLoadSchema = z.object({
  tenantId: z.string().uuid().optional(),
  transactionDate: z.coerce.date().optional(),
  description: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  paymentMethod: z.nativeEnum(paymentMethodEnum).optional(),
  referenceNumber: z.string().min(1).optional(),
});

export type BulkIndividualLoadDto = z.infer<typeof BulkIndividualLoadSchema>;
