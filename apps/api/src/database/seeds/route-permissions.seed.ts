import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { permissions, routePermissions } from '../index';

export async function seedRoutePermissions(db: NodePgDatabase<typeof schema>) {
  console.log('Seeding route permissions...');

  // Get permissions by name
  const getPermissionByName = async (name: string) => {
    const permission = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, name));

    if (permission.length === 0) {
      throw new Error(`Permission ${name} not found`);
    }

    return permission[0];
  };

  // Users routes
  const readUsersPermission = await getPermissionByName('read:users');
  const readUserPermission = await getPermissionByName('read:user');
  const createUserPermission = await getPermissionByName('create:user');
  const updateUserPermission = await getPermissionByName('update:user');
  const deleteUserPermission = await getPermissionByName('delete:user');

  await db
    .insert(routePermissions)
    .values({ route: '/users', permissionId: readUsersPermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/users/:id', permissionId: readUserPermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/users', permissionId: createUserPermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/users/:id', permissionId: updateUserPermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/users/:id', permissionId: deleteUserPermission.id })
    .onConflictDoNothing();

  // Roles routes
  const readRolesPermission = await getPermissionByName('read:roles');
  const readRolePermission = await getPermissionByName('read:role');
  const createRolePermission = await getPermissionByName('create:role');
  const updateRolePermission = await getPermissionByName('update:role');
  const deleteRolePermission = await getPermissionByName('delete:role');

  await db
    .insert(routePermissions)
    .values({ route: '/roles', permissionId: readRolesPermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/roles/:id', permissionId: readRolePermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/roles', permissionId: createRolePermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/roles/:id', permissionId: updateRolePermission.id })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({ route: '/roles/:id', permissionId: deleteRolePermission.id })
    .onConflictDoNothing();

  // Permissions routes
  const readPermissionsPermission =
    await getPermissionByName('read:permissions');
  const readPermissionPermission = await getPermissionByName('read:permission');
  const createPermissionPermission =
    await getPermissionByName('create:permission');
  const updatePermissionPermission =
    await getPermissionByName('update:permission');
  const deletePermissionPermission =
    await getPermissionByName('delete:permission');

  await db
    .insert(routePermissions)
    .values({
      route: '/permissions',
      permissionId: readPermissionsPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/permissions/:id',
      permissionId: readPermissionPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/permissions',
      permissionId: createPermissionPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/permissions/:id',
      permissionId: updatePermissionPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/permissions/:id',
      permissionId: deletePermissionPermission.id,
    })
    .onConflictDoNothing();

  // Role-Permissions routes
  const readRolePermissionsPermission = await getPermissionByName(
    'read:role-permissions',
  );
  const assignRolePermissionsPermission = await getPermissionByName(
    'assign:role-permissions',
  );
  const deleteRolePermissionPermission = await getPermissionByName(
    'delete:role-permission',
  );

  await db
    .insert(routePermissions)
    .values({
      route: '/role-permissions/role/:roleId',
      permissionId: readRolePermissionsPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/role-permissions/assign',
      permissionId: assignRolePermissionsPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/role-permissions/role/:roleId/permission/:permissionId',
      permissionId: deleteRolePermissionPermission.id,
    })
    .onConflictDoNothing();

  // User-Roles routes
  const readUserRolesPermission = await getPermissionByName('read:user-roles');
  const assignUserRolePermission =
    await getPermissionByName('assign:user-role');
  const deleteUserRolePermission =
    await getPermissionByName('delete:user-role');

  await db
    .insert(routePermissions)
    .values({
      route: '/user-roles/user/:userId',
      permissionId: readUserRolesPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/user-roles/assign',
      permissionId: assignUserRolePermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/user-roles/user/:userId/role/:roleId',
      permissionId: deleteUserRolePermission.id,
    })
    .onConflictDoNothing();

  // Route-Permissions routes
  await db
    .insert(routePermissions)
    .values({
      route: '/route-permissions',
      permissionId: readRolePermissionsPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/route-permissions/:id',
      permissionId: readRolePermissionsPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/route-permissions',
      permissionId: createPermissionPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/route-permissions/:id',
      permissionId: updatePermissionPermission.id,
    })
    .onConflictDoNothing();
  await db
    .insert(routePermissions)
    .values({
      route: '/route-permissions/:id',
      permissionId: deletePermissionPermission.id,
    })
    .onConflictDoNothing();

  console.log('Route permissions seeded successfully');
}
