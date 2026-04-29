import z from 'zod';
import { CreateBankDirectorySchema } from './bank-directory.schema';

export const UpdateBankDirectorySchema = CreateBankDirectorySchema.partial();
export type UpdateBankDirectoryDto = z.infer<typeof UpdateBankDirectorySchema>;
