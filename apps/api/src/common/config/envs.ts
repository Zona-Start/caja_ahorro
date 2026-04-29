import 'dotenv/config';
import { z } from 'zod';

export const envVarsSchema = z.object({
  HOST: z.string().min(1).default('localhost'),
  ALLOW_CORS_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string(),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRY: z.string(),
  bcryptSaltRounds: z.coerce.number().int().positive().default(10),
  RUN_SEED: z.coerce.boolean().default(false),
  MAIL_HOST: z.string().optional(),
  MAIL_USERNAME: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  REFRESH_TOKEN_GRACE_PERIOD_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15000),
});

// Extraemos el tipo de Zod para tener autocompletado estricto en el ConfigService
export type EnvironmentVariables = z.infer<typeof envVarsSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envVarsSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(
      `\n❌ Error de validación en variables de entorno:\n${errors}`,
    );
  }

  return result.data;
}
