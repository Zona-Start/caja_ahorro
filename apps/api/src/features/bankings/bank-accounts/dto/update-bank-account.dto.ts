import z from 'zod';
import { CreateBankAccountSchema } from './bank-accounts.schema';

export const UpdateBankAccountSchema = CreateBankAccountSchema.partial();
export type UpdateBankAccountDto = z.infer<typeof UpdateBankAccountSchema>;
