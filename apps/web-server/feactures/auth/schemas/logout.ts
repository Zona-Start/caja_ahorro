import z from 'zod';

export const logoutResponseSchema = z.object({
  message: z.string(),
});
