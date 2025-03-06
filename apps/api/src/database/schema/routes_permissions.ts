import * as t from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';
import { permissions } from './roles_permissions';

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de rutas permisos
export const routePermissions = authSchema.table(
  'route_permissions',
  {
    id: t.serial('id').primaryKey(),
    route: t.text('route').notNull(),
    permissionId: t
      .integer('permissions_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (routePermission) => ({
    routePermissionIdx: index('route_permissions_idx').on(
      routePermission.route,
    ),
  }),
);
