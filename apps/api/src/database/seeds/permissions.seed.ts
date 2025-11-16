import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions } from '../index';

export async function seedPermissions(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding permissions...');

  // User permissions
  await db.insert(permissions).values({ name: 'read:users', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:user', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:user', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:user', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:user', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // Role permissions
  await db.insert(permissions).values({ name: 'read:roles', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:role', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:role', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:role', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:role', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // Permission permissions
  await db.insert(permissions).values({ name: 'read:permissions', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'read:permission', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'create:permission', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'update:permission', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:permission', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // Role-Permission permissions
  await db.insert(permissions).values({ name: 'read:role-permissions', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'assign:role-permissions', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:role-permission', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // User-Role permissions
  await db.insert(permissions).values({ name: 'read:user-roles', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'assign:user-role', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'delete:user-role', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // Auth permissions
  await db.insert(permissions).values({ name: 'auth:sign-out', createdById: 1, updatedById: 1 }).onConflictDoNothing();
  await db.insert(permissions).values({ name: 'auth:refresh-token', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  // Initial Balance permissions
  await db.insert(permissions).values({ name: 'create:initial-balance', createdById: 1, updatedById: 1 }).onConflictDoNothing();

  console.log('Permissions seeded successfully');
}