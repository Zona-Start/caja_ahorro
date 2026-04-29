import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './src/database/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', (client) => {
  client.query(
    'SET search_path TO public, auth, tenant, core, inventory, accounting, savings, purchasing, treasury, audit'
  );
});

const db = drizzle({ client: pool, schema, logger: true });

async function run() {
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin'),
      with: {
        tenantMembers: {
          with: {
            tenant: true,
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
        userPermissions: {
          with: { permission: true },
        },
      },
    });
    console.log(user);
  } catch (error) {
    console.error(error);
  } finally {
    pool.end();
  }
}

run();
