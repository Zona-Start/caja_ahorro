import 'dotenv/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envVarsSchema } from '../src/common/config/envs';
import * as schema from '../src/database/schema';
import { provisionAssociates } from '../src/features/provisioning/provisioning';

/**
 * Aprovisiona cuentas del portal para los asociados sin acceso.
 * Uso:  pnpm --filter portal-api sync:associates [tenantId]
 */
async function main() {
  const env = envVarsSchema.parse(process.env);
  const tenantId = process.argv[2];
  const limit = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

  const pool = new Pool({
    connectionString: env.PORTAL_DATABASE_URL,
    max: 5,
    ssl:
      env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;

  try {
    const result = await provisionAssociates(db, {
      tenantId,
      limit,
      saltRounds: env.PORTAL_BCRYPT_SALT_ROUNDS,
    });
    console.log(
      `✅ Aprovisionamiento completado. Asociados sin cuenta: ${result.total}, creados: ${result.created}.`,
    );
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error en el aprovisionamiento:', error);
    process.exit(1);
  });
