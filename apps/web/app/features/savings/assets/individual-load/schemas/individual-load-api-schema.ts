import { z } from 'zod';

export const loadAssestApiResponseSchema = z.object({
  message: z.string(),
  movementId: z.string().optional(),
});

export interface Associates {
  id: number;
  fullname: string;
  cedula: string;
  accountNumber: string;
  balance: number;
  associateAccountsId: number;
}
