import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envs } from 'src/common/config/envs';
import * as schema from '../index';
import { seedAdminRole } from './admin-role.seed';
import { seedPermissions } from './permissions.seed';
import { seedRoutePermissions } from './route-permissions.seed';

async function main() {
  const pool = new Pool({
    connectionString: envs.dataBaseUrl,
  });

  const db = drizzle(pool, { schema });

  try {
    // Run seeds in order
    await seedPermissions(db);
    await seedAdminRole(db);
    await seedRoutePermissions(db);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main();
