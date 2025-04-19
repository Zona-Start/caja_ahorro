import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions, roles, rolesPermissions } from '../index';


export async function seedAdminRolePermission(db: NodePgDatabase<typeof schema>) {

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
          createdById: 1, 
          updatedById: 1
        })
        .onConflictDoNothing();
    }
  }

  console.log('Admin roles seeded successfully with all permissions');
}
