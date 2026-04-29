import { relations } from 'drizzle-orm';
import {
  loginAttempts,
  permissions,
  rolePermissions,
  roles,
  sessions,
  tenantMembers,
  userPermissions,
  users,
} from '../tables/auth';
import { tenants } from '../tables/tenants';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  tenantMembers: many(tenantMembers),
  userPermissions: many(userPermissions),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  tenantMembers: many(tenantMembers),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  user: one(users, {
    fields: [tenantMembers.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [tenantMembers.roleId],
    references: [roles.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
  tenant: one(tenants, {
    fields: [userPermissions.tenantId],
    references: [tenants.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));
