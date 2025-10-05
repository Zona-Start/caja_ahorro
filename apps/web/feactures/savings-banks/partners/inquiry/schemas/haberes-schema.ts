import z from 'zod';
import { haberesMovementSchema } from './inquiry-schema';

export type HaberesData = z.infer<typeof haberesMovementSchema> | undefined;
