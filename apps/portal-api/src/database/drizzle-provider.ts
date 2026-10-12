import { Env } from '@/common/config/envs';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

/**
 * Pool propio del portal (separado del ERP) con el rol `portal_app`
 * y timeouts defensivos para no afectar procesos pesados (cierres) del ERP.
 *
 * El `search_path` debe incluir `portal` en `PORTAL_DATABASE_URL`.
 */
export const DrizzleProvider: Provider = {
  provide: DRIZZLE_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<Env, true>) => {
    const databaseUrl = configService.get('PORTAL_DATABASE_URL', {
      infer: true,
    });
    const nodeEnv = configService.get('NODE_ENV', { infer: true });
    const sslMode = configService.get('PORTAL_DB_SSL', { infer: true });

    const useSsl =
      sslMode === 'true' || (sslMode === 'auto' && nodeEnv === 'production');

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      // Defensas ante consultas colgadas (los valores no soportados se ignoran).
      statement_timeout: 5000,
      idle_in_transaction_session_timeout: 15000,
      lock_timeout: 3000,
    });

    return drizzle(pool, { schema }) as DrizzleDatabase;
  },
};
