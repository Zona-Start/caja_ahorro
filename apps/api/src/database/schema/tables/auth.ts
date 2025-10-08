import { sql } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { authSchema } from '../schemas';

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
  createdById: t
    .integer('created_by_id')
    .references(() => users.id, { onDelete: 'set null' }),
  updatedById: t
    .integer('updated_by_id')
    .references(() => users.id, { onDelete: 'set null' }),
};

export const timestampsShort = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de Usuarios sistema
export const users = authSchema.table(
  'users',
  {
    id: t.serial('id').primaryKey(),
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
    usersIdx: t.index('users_idx').on(users.username),
  }),
);

// Tabla de Roles
export const roles = authSchema.table(
  'roles',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    ...timestamps,
  },
  (roles) => ({
    rolesIdx: t.index('roles_idx').on(roles.name),
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
    permissionsIdx: t.index('permissions_idx').on(permissions.name),
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
    rolesPermissionIdx1: t
      .index('roles_permission_idx01')
      .on(rolesPermission.roleId),
    rolesPermissionIdx2: t
      .index('roles_permission_idx02')
      .on(rolesPermission.permissionId),
  }),
);

//tabla User_roles
export const usersRole = authSchema.table(
  'user_role',
  {
    id: t.serial('id').primaryKey(),
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: t
      .integer('role_id')
      .references(() => roles.id, { onDelete: 'set null' }),
    ...timestampsShort,
  },
  (userRole) => ({
    userRoleIdx: t.index('user_role_idx').on(userRole.userId),
  }),
);

// Tabla de Sesiones
export const sessions = authSchema.table(
  'sessions',
  {
    id: t
      .uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sessionToken: t.text('session_token').notNull(),
    expiresAt: t.integer('expires_at').notNull(),
    ...timestampsShort,
  },
  (sessions) => ({
    sessionsIdx: t.index('sessions_idx').on(sessions.sessionToken),
  }),
);

//tabla de tokens de verificación
export const verificationTokens = authSchema.table(
  'verificationToken',
  {
    identifier: t.text('identifier').notNull(),
    token: t.text('token').notNull(),
    code: t.integer('code'),
    expires: t.timestamp('expires', { mode: 'date' }).notNull(),
    ipAddress: t.text('ip_address').notNull(),
  },
  (verificationToken) => [
    {
      compositePk: t.primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);
