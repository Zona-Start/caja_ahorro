import { z } from 'zod';
import { tokensSchema } from './login';

// Esquema para el refresh token
export const refreshTokenSchema = z.object({
  token: z.string(),
});

export type RefreshTokenValue = z.infer<typeof refreshTokenSchema>;

// Esquema final para la respuesta del backend
export const RefreshTokenResponseSchema = z.object({
  tokens: tokensSchema,
});
