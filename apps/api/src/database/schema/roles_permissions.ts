import * as t from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de Roles
export const roles = authSchema.table(
  'roles',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    ...timestamps,
  },
  (roles) => ({
    rolesIdx: index('roles_idx').on(roles.name),
  }),
);

// Tabla de Permisos
export const permissions = authSchema.table(
  'permissions',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    ...timestamps,
  },
  (permissions) => ({
    permissionsIdx: index('permissions_idx').on(permissions.name),
  }),
);

// Tabla de Permisos
export const rolesPermissions = authSchema.table(
  'roles_permissions',
  {
    id: t.serial('id').primaryKey(),
    roleId: t
      .integer('role_id')
      .references(() => roles.id, { onDelete: 'set null' }),
    permissionId: t
      .integer('permissions_id')
      .references(() => permissions.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (rolesPermission) => ({
    rolesPermissionIdx1: index('roles_permission_idx01').on(
      rolesPermission.roleId,
    ),
    rolesPermissionIdx2: index('roles_permission_idx02').on(
      rolesPermission.permissionId,
    ),
  }),
);
