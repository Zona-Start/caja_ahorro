import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envs } from 'src/common/config/envs';
import * as schema from '../index';
import { seedAdminRole } from './admin-role.seed';
import { seedUserAdmin } from './user-admin.seed';

async function main() {
  const pool = new Pool({
    connectionString: envs.dataBaseUrl,
    ssl:
    envs.node_env === 'production' ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool, { schema });

  try {
    // Run seeds in order
    await seedAdminRole(db);
    await seedUserAdmin(db)
    //await seedRoutePermissions(db);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main();
