import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions } from '../index';

export async function seedPermissions(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding permissions...');

  // User permissions
  await db.insert(permissions).values({ name: 'read:users' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:user' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:user' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:user' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:user' }).onConflictDoNothing();

  // Role permissions
  await db.insert(permissions).values({ name: 'read:roles' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:role' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:role' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:role' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:role' }).onConflictDoNothing();

  // Permission permissions
  await db.insert(permissions).values({ name: 'read:permissions' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:permission' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:permission' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:permission' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:permission' }).onConflictDoNothing();

  // Role-Permission permissions
  await db.insert(permissions).values({ name: 'read:role-permissions' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'assign:role-permissions' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:role-permission' }).onConflictDoNothing();

  // User-Role permissions
  await db.insert(permissions).values({ name: 'read:user-roles' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'assign:user-role' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:user-role' }).onConflictDoNothing();

  // Auth permissions
  await db.insert(permissions).values({ name: 'auth:sign-out' }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'auth:refresh-token' }).onConflictDoNothing();

  console.log('Permissions seeded successfully');
}