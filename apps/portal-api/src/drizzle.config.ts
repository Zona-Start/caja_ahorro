import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { envVarsSchema } from './common/config/envs';

const envVars = envVarsSchema.parse(process.env);

/**
 * drizzle-kit gestiona ÚNICAMENTE el esquema `portal`.
 * El subconjunto de tablas del ERP que el portal lee NO se genera aquí
 * (opción A del plan Fase 1).
 */
export default {
  schema: './src/database/schema/portal.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  schemaFilter: ['portal'],
  // Tabla de tracking PROPIA (no compartir con el ERP, que usa drizzle.__drizzle_migrations).
  migrations: {
    schema: 'drizzle',
    table: '__portal_migrations',
  },
  dbCredentials: {
    url: envVars.PORTAL_DATABASE_URL,
  },
} satisfies Config;
