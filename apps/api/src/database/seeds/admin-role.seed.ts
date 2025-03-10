import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions, roles, rolesPermissions } from '../index';

export async function seedAdminRole(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding admin role...');

  // Create admin role if it doesn't exist
  const [adminRole] = await db
    .insert(roles)
    .values({ name: 'ADMIN' })
    .onConflictDoNothing()
    .returning();

  if (!adminRole) {
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'ADMIN'));

    if (existingRole.length > 0) {
      console.log('Admin role already exists');
      return;
    }

    throw new Error('Failed to create admin role');
  }

  // Get all permissions
  const allPermissions = await db.select().from(permissions);

  // Assign all permissions to admin role
  for (const permission of allPermissions) {
    await db
      .insert(rolesPermissions)
      .values({
        roleId: adminRole.id,
        permissionId: permission.id,
      })
      .onConflictDoNothing();
  }

  console.log('Admin role seeded successfully with all permissions');
}
