import { z } from 'zod';
import { associateApiSchema } from '@/features/savings/partners/associates/schemas/associates-response-api';

export const loadAssestApiResponseSchema = z.object({
  message: z.string(),
  movementId: z.string().optional(),
});

export type Associates = z.infer<typeof associateApiSchema> & {
  associateAccountsId?: number;
  accountNumber: string;
  balance: string;
};
