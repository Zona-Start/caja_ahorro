import * as t from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';
import { index, QueryBuilder } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { roles } from './roles_permissions';

const qb = new QueryBuilder();

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de Usuarios
export const users = authSchema.table(
  'users',
  {
    id: t
      .uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: t.text('username').unique().notNull(),
    email: t.text('email').unique().notNull(),
    fullname: t.text('fullname').notNull(),
    phone: t.text('phone'),
    password: t.text('password').notNull(),
    isTwoFactorEnabled: t
      .boolean('is_two_factor_enabled')
      .notNull()
      .default(false),
    twoFactorSecret: t.text('two_factor_secret'),
    isEmailVerified: t.boolean('is_email_verified').notNull().default(false),
    isActive: t.boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (users) => ({
    usersIdx: index('users_idx').on(users.username),
  }),
);

//tabla User_roles
export const usersRole = authSchema.table(
  'user_role',
  {
    id: t.serial('id').primaryKey(),
    userId: t
      .uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: t
      .integer('role_id')
      .references(() => roles.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (userRole) => ({
    userRoleIdx: index('user_role_idx').on(userRole.userId),
  }),
);

export const userAccessView = authSchema.view('user_access_view', {
  userId: t.uuid('userId').notNull(),
  username: t.text('username').notNull(),
  email: t.text('email').notNull(),
  fullname: t.text('email').notNull(),
  roleId: t.integer('role_id'),
  roleName: t.text('role_name'),
  permissionId: t.integer('permission_id'),
  permissionName: t.text('permission_name'),
  route: t.text('route'),
}).as(sql`
   SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.fullname,
    r.id AS role_id,
    r.name AS role_name,
    p.id AS permission_id,
    p.name AS permission_name,
    rp.route
FROM
  auth.users u
LEFT JOIN
  auth.user_role ur ON u.id = ur.user_id 
LEFT JOIN
  auth.roles r ON ur.role_id  = r.id
LEFT JOIN
  auth.permissions p ON r.id = (SELECT rp2.permissions_id  FROM auth.route_permissions rp2 WHERE rp2.permissions_id  = p.id)
LEFT JOIN
  auth.route_permissions rp ON p.id = rp.permissions_id `);
