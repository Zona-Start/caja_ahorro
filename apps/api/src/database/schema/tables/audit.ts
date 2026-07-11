import * as t from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { auditSchema } from '../_schemas';
import { tenants } from './tenants';

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

export const AUDIT_TARGET_TYPES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  SESSION: 'session',
  ASSOCIATE: 'associate',
  TENANT: 'tenant',
  CATEGORY: 'category',
  ACCOUNT: 'account',
  TRANSACTION: 'transaction',
  REPORT: 'report',
  SETTINGS: 'settings',
} as const;

export const SEVERITY_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export const SYSTEM_EVENT_TYPES = {
  DATABASE_ERROR: 'database_error',
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_FAILED: 'authentication_failed',
  AUTHORIZATION_FAILED: 'authorization_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INTERNAL_SERVER_ERROR: 'internal_server_error',
  EXTERNAL_API_ERROR: 'external_api_error',
  CRON_JOB_FAILED: 'cron_job_failed',
  BACKUP_FAILED: 'backup_failed',
} as const;

export const auditEvents = auditSchema.table(
  'audit_events',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    tenantId: t.uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),
    userId: t.uuid('user_id'),
    correlationId: t.uuid('correlation_id'),

    action: t.varchar('action', { length: 50 }).notNull(),
    targetType: t.varchar('target_type').notNull(),

    targetId: t.text('target_id'),
    targetCedula: t.varchar('target_cedula', { length: 20 }),

    changes: t.jsonb('changes'),
    previousValues: t.jsonb('previous_values'),
    newValues: t.jsonb('new_values'),

    ipAddress: t.varchar('ip_address', { length: 45 }),
    userAgent: t.text('user_agent'),
    deviceFingerprint: t.text('device_fingerprint'),
    geoLocation: t.jsonb('geo_location'),

    description: t.text('description'),
    metadata: t.jsonb('metadata'),

    createdAt: t.timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_user_id_idx').on(table.userId),
    index('audit_target_type_idx').on(table.targetType),
    index('audit_target_id_idx').on(table.targetId),
    index('audit_action_idx').on(table.action),
    index('audit_created_at_idx').on(table.createdAt),
    index('audit_tenant_id_idx').on(table.tenantId),
    index('audit_correlation_id_idx').on(table.correlationId),
  ],
);

export const systemEvents = auditSchema.table(
  'system_events',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    tenantId: t.uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),

    severity: t.varchar('severity', { length: 20 }).notNull(),
    eventType: t.varchar('event_type', { length: 50 }).notNull(),

    source: t.varchar('source', { length: 100 }).notNull(),

    message: t.text('message').notNull(),
    stackTrace: t.text('stack_trace'),

    userId: t.uuid('user_id'),
    sessionId: t.uuid('session_id'),
    correlationId: t.uuid('correlation_id'),

    requestPath: t.varchar('request_path', { length: 500 }),
    requestMethod: t.varchar('request_method', { length: 10 }),
    requestBody: t.jsonb('request_body'),

    metadata: t.jsonb('metadata'),
    resolvedAt: t.timestamp('resolved_at'),
    resolvedBy: t.uuid('resolved_by'),

    createdAt: t.timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('system_severity_idx').on(table.severity),
    index('system_event_type_idx').on(table.eventType),
    index('system_source_idx').on(table.source),
    index('system_created_at_idx').on(table.createdAt),
    index('system_resolved_at_idx').on(table.resolvedAt),
    index('system_tenant_id_idx').on(table.tenantId),
  ],
);
