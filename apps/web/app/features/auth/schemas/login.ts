import { z } from 'zod';

// Definir esquema de validación con Zod para el formulario
export const formSchema = z.object({
  username: z
    .string()
    .min(5, { message: 'Usuario debe tener minimo 5 caracteres' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export type UserFormValue = z.infer<typeof formSchema>;

// Esquema para el rol
const rolSchema = z.object({
  id: z.number(),
  rol: z.string(),
});

// Esquema para el usuario
const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullname: z.string(),
  email: z.string().email(),
  rol: z.array(rolSchema),
});

// Esquema para los tokens
export const tokensSchema = z.object({
  access_token: z.string(),
  access_expire_in: z.number(),
  refresh_token: z.string(),
  refresh_expire_in: z.number(),
});

// Esquema final para la respuesta del backend
export const loginResponseSchema = z.object({
  message: z.string(),
  user: userSchema,
  tokens: tokensSchema,
});

// Tipo TypeScript basado en el esquema de Zod
export type LoginResponse = z.infer<typeof loginResponseSchema>;
