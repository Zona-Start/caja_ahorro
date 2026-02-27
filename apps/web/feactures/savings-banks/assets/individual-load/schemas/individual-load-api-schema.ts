import { associateApiSchema } from '@/feactures/savings-banks/partners/associates/schemas/associates-response-api';
import { z } from 'zod';

// Esquema de validación para el formulario
export const loadAssestApiResponseSchema = z.object({
  message: z.string(),
  movementId: z.number().optional(),
});

export type Associates = z.infer<typeof associateApiSchema>;
