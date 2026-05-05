import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvironmentVariables } from 'src/common/config/envs';
import * as schema from './schema';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;  

export const DrizzleProvider: Provider = {
  provide: DRIZZLE_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentVariables, true>) => {
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });
    const nodeEnv = configService.get('NODE_ENV', { infer: true });

    const pool = new Pool({
      connectionString: databaseUrl,
      // Se recomienda un máximo de conexiones para evitar saturar el pool en procesos de seed
      max: 10,
      ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });

    // IMPORTANTE: El 'search_path' debe ir en la variable de entorno DATABASE_URL:
    // DATABASE_URL="postgres://user:pass@host:5432/db?options=-c search_path=public,auth,tenant,core..."

    return drizzle(pool, { schema }) as DrizzleDatabase;
  },
};
