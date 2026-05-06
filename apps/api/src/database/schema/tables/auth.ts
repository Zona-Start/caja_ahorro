import { timestamps } from '@/database/timestamps';
import * as t from 'drizzle-orm/pg-core';
import { authSchema } from '../_schemas';
import {
  permissionActionEnum,
  permissionResourceEnum,
  permissionScopeEnum,
} from '../enum';
import { tenants } from './tenants';

// Tabla de Usuarios sistema
export const users = authSchema.table(
  'users',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    username: t.varchar('username', { length: 50 }).notNull(),
    passwordHash: t.text('password_hash').notNull(),
    fullname: t.text('fullname').notNull(),
    phone: t.text('phone'),
    email: t.varchar('email', { length: 100 }).notNull(),
    status: t.varchar('status', { length: 20 }).notNull().default('active'),
    isSystemAdmin: t.boolean('is_system_admin').default(false).notNull(),
    ...timestamps,
    deletedBy: t.uuid('deleted_by'),
    deletedAt: t.timestamp('deleted_at'),
    lastLoginAt: t.timestamp('last_login_at'),
  },
  (table) => [
    t.uniqueIndex('users_username_idx').on(table.username),
    t.uniqueIndex('users_email_idx').on(table.email),
    t.index('users_status_idx').on(table.status),
    t.index('users_is_system_admin_idx').on(table.isSystemAdmin),
  ],
);

// Tabla de Roles
export const roles = authSchema.table(
  'roles',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    tenantId: t
      .uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    name: t.varchar('name', { length: 50 }).notNull(),
    description: t.text('description'),
    isDefault: t.boolean('is_default').default(false),
    deletedBy: t.uuid('deleted_by'),
    deletedAt: t.timestamp('deleted_at'),
    ...timestamps,
  },
  (table) => [
    t.uniqueIndex('roles_tenant_name_idx').on(table.tenantId, table.name),
    t.index('roles_tenant_id_idx').on(table.tenantId),
    t.index('roles_is_default_idx').on(table.isDefault),
  ],
);

// Tabla de Permisos
export const permissions = authSchema.table(
  'permissions',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    name: t.varchar('name', { length: 100 }).notNull(),

    resource: permissionResourceEnum('resource').notNull(),
    action: permissionActionEnum('action').notNull(),
    scope: permissionScopeEnum('scope').default('own').notNull(),

    description: t.text('description'),
    isActive: t.boolean('is_active').default(true).notNull(),
    ...timestamps,
    deletedBy: t.uuid('deleted_by'),
    deletedAt: t.timestamp('deleted_at'),
  },
  (table) => [
    t
      .uniqueIndex('permissions_resource_action_scope_idx')
      .on(table.resource, table.action, table.scope),
    t.index('permissions_resource_idx').on(table.resource),
    t.index('permissions_action_idx').on(table.action),
    t.index('permissions_scope_idx').on(table.scope),
    t.index('permissions_is_active_idx').on(table.isActive),
  ],
);

export const tenantMembers = authSchema.table(
  'tenant_members',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    userId: t
      .uuid('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    tenantId: t
      .uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    roleId: t
      .uuid('role_id')
      .references(() => roles.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    isActive: t.boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    t
      .uniqueIndex('tenant_members_user_tenant_idx')
      .on(table.userId, table.tenantId),
    t.index('tenant_members_tenant_id_idx').on(table.tenantId),
    t.index('tenant_members_user_id_idx').on(table.userId),
    t.index('tenant_members_role_id_idx').on(table.roleId),
  ],
);

export const userPermissions = authSchema.table(
  'user_permissions',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    tenantId: t
      .uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    userId: t
      .uuid('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    permissionId: t.uuid('permission_id').notNull(),
    ...timestamps,
  },
  (table) => [
    t
      .uniqueIndex('user_permissions_tenant_user_perm_idx')
      .on(table.tenantId, table.userId, table.permissionId),
    t.index('user_permissions_tenant_id_idx').on(table.tenantId),
    t.index('user_permissions_user_id_idx').on(table.userId),
  ],
);

// Tabla de Permisos
export const rolePermissions = authSchema.table(
  'role_permissions',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    roleId: t
      .uuid('role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    permissionId: t
      .uuid('permission_id')
      .notNull()
      .references(() => permissions.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    isCustom: t.boolean('is_custom').default(false),
    ...timestamps,
  },
  (table) => [
    t.index('role_permissions_role_id_idx').on(table.roleId),
    t.index('role_permissions_permission_id_idx').on(table.permissionId),
  ],
);

// Tabla de Sesiones

export const sessions = authSchema.table(
  'sessions',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    userId: t
      .uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    refreshToken: t.text('refresh_token').notNull(),
    refreshTokenHash: t.text('refresh_token_hash').notNull(),
    refreshTokenExpiresAt: t.timestamp('refresh_token_expires_at').notNull(),

    previousRefreshTokenHash: t.text('previous_refresh_token_hash'),
    lastRotatedAt: t.timestamp('last_rotated_at'),
    rotationCount: t.integer('rotation_count').default(0),

    ipAddress: t.varchar('ip_address', { length: 45 }),
    userAgent: t.text('user_agent'),
    deviceFingerprint: t.text('device_fingerprint'),
    geoLocation: t.jsonb('geo_location'),
    authMethod: t.varchar('auth_method', { length: 20 }),
    correlationId: t.uuid('correlation_id'),

    isActive: t.boolean('is_active').default(true).notNull(),
    createdAt: t.timestamp('created_at').defaultNow().notNull(),
    updatedAt: t.timestamp('updated_at'),
    revokedAt: t.timestamp('revoked_at'),
    revokedReason: t.text('revoked_reason'),
    revokedBy: t.uuid('revoked_by'),
  },
  (table) => [
    t.index('sessions_user_id_idx').on(table.userId),
    t.index('sessions_refresh_token_hash_idx').on(table.refreshTokenHash),
    t.index('sessions_revoked_at_idx').on(table.revokedAt),
    t.index('sessions_is_active_idx').on(table.isActive),
    t.index('sessions_correlation_id_idx').on(table.correlationId),
    t.index('sessions_device_fingerprint_idx').on(table.deviceFingerprint),
    t.index('sessions_created_at_idx').on(table.createdAt),
  ],
);

export const loginAttempts = authSchema.table(
  'login_attempts',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    userId: t
      .uuid('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    username: t.varchar('username', { length: 50 }).notNull(),

    ipAddress: t.varchar('ip_address', { length: 45 }).notNull(),
    userAgent: t.text('user_agent'),
    deviceFingerprint: t.text('device_fingerprint'),
    geoLocation: t.jsonb('geo_location'),

    success: t.boolean('success').notNull(),
    failureReason: t.varchar('failure_reason', { length: 100 }),

    correlationId: t.uuid('correlation_id'),
    createdAt: t.timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    t.index('login_attempts_user_id_idx').on(table.userId),
    t.index('login_attempts_username_idx').on(table.username),
    t.index('login_attempts_ip_address_idx').on(table.ipAddress),
    t.index('login_attempts_created_at_idx').on(table.createdAt),
    t.index('login_attempts_success_idx').on(table.success),
    t.index('login_attempts_correlation_id_idx').on(table.correlationId),
  ],
);

export const FAILURE_REASONS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  USER_INACTIVE: 'user_inactive',
  ACCOUNT_LOCKED: 'account_locked',
  IP_BLOCKED: 'ip_blocked',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const;

export const AUTH_METHODS = {
  PASSWORD: 'password',
  OAUTH: 'oauth',
  MFA: 'mfa',
  API_KEY: 'api_key',
} as const;
