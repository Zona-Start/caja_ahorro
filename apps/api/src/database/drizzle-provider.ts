import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // <-- 1. Importamos ConfigService
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvironmentVariables } from 'src/common/config/envs'; // <-- 2. Importamos el tipado de Zod
import * as schema from './schema'; // Importa tu esquema completo

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;  

export const DrizzleProvider: Provider = {
  provide: DRIZZLE_PROVIDER,
  // 3. Le decimos a NestJS qué dependencias inyectar en el factory
  inject: [ConfigService],

  // 4. Recibimos el ConfigService como argumento fuertemente tipado
  useFactory: (configService: ConfigService<EnvironmentVariables, true>) => {
    // 5. Extraemos las variables con inferencia de tipos perfecta
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });
    const nodeEnv = configService.get('NODE_ENV', { infer: true });

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('connect', (client) => {
      client.query(
        'SET search_path TO public, auth, tenant, core, inventory, accounting, savings, purchasing, treasury, audit'
      );
    });

    return drizzle({ client: pool, schema }) as DrizzleDatabase; // Nota: en las versiones recientes de Drizzle es { client: pool } en lugar de pasar pool directamente
  },
};
