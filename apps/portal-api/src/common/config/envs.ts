import 'dotenv/config';
import { z } from 'zod';

export const envVarsSchema = z.object({
  HOST: z.string().min(1).default('localhost'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  ALLOW_CORS_URL: z.string().min(1),
  PLATFORM_DOMAIN: z.string().min(1).default('zonastart.local'),

  // Conexión con el rol `portal_app` (mínimo privilegio).
  PORTAL_DATABASE_URL: z.string().min(1),
  // SSL de la conexión a BD: auto (TLS en producción) | true | false.
  PORTAL_DB_SSL: z.enum(['auto', 'true', 'false']).default('auto'),

  // Realm de identidad propio del portal (sin fallback por seguridad).
  PORTAL_JWT_SECRET: z.string().min(32),
  PORTAL_JWT_REFRESH_SECRET: z.string().min(32),
  PORTAL_JWT_EXPIRY: z.string().default('15m'),
  PORTAL_JWT_REFRESH_EXPIRY: z.string().default('7d'),
  PORTAL_BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive().default(10),
  PORTAL_MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  PORTAL_LOCK_MINUTES: z.coerce.number().int().positive().default(15),

  // Correo (OTP) vía Resend.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().min(1).default('Portal <no-reply@zonastart.local>'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // Aprovisionamiento automático (cron). Activo por defecto: diario 06:00.
  PORTAL_PROVISIONING_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  PORTAL_PROVISIONING_CRON: z.string().default('0 6 * * *'),
  PORTAL_PROVISIONING_TZ: z.string().default('America/Caracas'),
  PORTAL_PROVISIONING_RUN_ON_START: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
});

export type Env = z.infer<typeof envVarsSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envVarsSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(
      `\n❌ Error de validación en variables de entorno (portal-api):\n${errors}`,
    );
  }

  return result.data;
}
