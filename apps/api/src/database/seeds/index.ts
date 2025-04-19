import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envs } from 'src/common/config/envs';
import * as schema from '../index';
import { seedAdminRolePermission } from './admin-role-permission.seed';
import { seedCurrencies } from './currents';
import { seedLocalities } from './localities';
import { seedMunicipalites } from './municipalities';
import { seedParishes } from './parishes';
import { seedPermissions } from './permissions.seed';
import { seedCompany } from './saving-banl';
import { seedStates } from './states';
import { seedSystemSetting } from './system-settings';
import { seedUserAdmin } from './user-admin-roles.seed';

async function main() {
  const pool = new Pool({
    connectionString: envs.dataBaseUrl,
    ssl: envs.node_env === 'production' ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool, { schema });

  try {
    // Run seeds in order
    await seedUserAdmin(db);
    await seedPermissions(db);
    await seedAdminRolePermission(db);
    await seedSystemSetting(db);
    await seedCurrencies(db);
    await seedStates(db);
    await seedMunicipalites(db);
    await seedParishes(db);
    await seedLocalities(db);
    await seedCompany(db);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main();
