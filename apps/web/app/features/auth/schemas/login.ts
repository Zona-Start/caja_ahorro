import { z } from 'zod';

export const identifierPasswordSchema = z.object({
  identifier: z
    .string()
    .min(3, {
      message: 'El usuario o correo debe tener al menos 3 caracteres',
    }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export const emailPasswordSchema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export const emailOnlySchema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
});

export type IdentifierPasswordValue = z.infer<typeof identifierPasswordSchema>;
export type EmailPasswordValue = z.infer<typeof emailPasswordSchema>;
export type EmailOnlyValue = z.infer<typeof emailOnlySchema>;
