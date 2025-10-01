import { z } from 'zod';

// Esquema para el refresh token
export const refreshTokenSchema = z.object({
  token: z.string(),
});

export type RefreshTokenValue = z.infer<typeof refreshTokenSchema>;

// Esquema final para la respuesta del backend
export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  access_expire_in: z.number(),
  refresh_token: z.string(),
  refresh_expire_in: z.number(),
});
