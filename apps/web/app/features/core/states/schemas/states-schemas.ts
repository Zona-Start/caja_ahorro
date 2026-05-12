import { z } from 'zod';

export const statesSchema = z.array(
  z.object({
    id: z.number().optional(),
    name: z.string(),
  }),
);

export type States = z.infer<typeof statesSchema>;
