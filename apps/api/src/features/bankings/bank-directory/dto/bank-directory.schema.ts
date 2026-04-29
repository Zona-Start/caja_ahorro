import { z } from 'zod';

export const CreateBankDirectorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export type CreateBankDirectoryDto = z.infer<typeof CreateBankDirectorySchema>;
