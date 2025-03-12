import { z } from 'zod';

// Cambiamos de un enum estático a un tipo string para soportar roles dinámicos
export const roleSchema = z.string();

export type Role = z.infer<typeof roleSchema>;
