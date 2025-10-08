import { Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envs } from 'src/common/config/envs';
import * as schema from './index';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export const DrizzleProvider: Provider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: () => {
    const pool = new Pool({
      connectionString: envs.dataBaseUrl,
      ssl:
        envs.node_env === 'production' ? { rejectUnauthorized: false } : false,
    });

    return drizzle(pool, { schema /**logger: true **/ }) as DrizzleDatabase;
  },
};
