import { Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './index';
import { envs } from 'src/common/config/envs';

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

    return drizzle(pool, { schema }) as DrizzleDatabase;
  },
};
