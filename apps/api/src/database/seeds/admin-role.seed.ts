import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions, roles, rolesPermissions } from '../index';
import { seedPermissions } from './permissions.seed';

export async function seedAdminRole(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding admin role...');

  // Insert roles
  const roleNames = ['superadmin', 'admin', 'contable', 'audit', 'user'];
  
  for (const roleName of roleNames) {
    try {
      await db.insert(roles).values({
        name: roleName
      }).onConflictDoNothing();
      console.log(`Role '${roleName}' created or already exists`);
    } catch (error) {
      console.error(`Error creating role '${roleName}':`, error);
    }
  }

  await seedPermissions(db);

  // Get all permissions
  const allPermissions = await db.select().from(permissions);

  // Get superadmin and admin roles
  const adminRoles = await db.select().from(roles).where(eq(roles.name, 'admin'));

  // Assign all permissions to superadmin and admin roles
  for (const role of adminRoles) {
    console.log(`Assigning permissions to ${role.name} role...`);
    
    for (const permission of allPermissions) {
      await db
        .insert(rolesPermissions)
        .values({
          roleId: role.id,
          permissionId: permission.id,
        })
        .onConflictDoNothing();
    }
  }

  console.log('Admin roles seeded successfully with all permissions');
}
