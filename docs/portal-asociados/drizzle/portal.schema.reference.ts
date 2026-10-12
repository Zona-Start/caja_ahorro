/**
 * ============================================================================
 *  Portal del Asociado · Esquema Drizzle (REFERENCIA)
 * ============================================================================
 *  Estado: DISEÑO (Fase 0). NO está conectado a la aplicación.
 *
 *  Uso previsto en Fase 1:
 *    copiar como `packages/database/src/schema/tables/portal.ts`
 *    (o `apps/api/src/database/schema/tables/portal.ts`), renombrar si aplica
 *    y ajustar imports según la ubicación final.
 *
 *  Requisitos de integración (ver 04-esquema-drizzle.md):
 *    - `_schemas.ts`:  export const portalSchema = pgSchema('portal');
 *    - `drizzle.config.ts`: agregar 'portal' a `schemaFilter`
 *    - `tables/index.ts`: exportar las tablas de este archivo
 *    - `relations/index.ts`: exportar las relaciones de este archivo
 *
 *  Migración:
 *    pnpm db:generate   -> genera el SQL
 *    pnpm db:migrate    -> aplica
 * ============================================================================
 */
import { relations, sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestampsShort } from '../../timestamps';
import { portalSchema } from '../_schemas';
import {
  portalAccessEventEnum,
  portalAccountStatusEnum,
  portalEmailStatusEnum,
  portalOtpPurposeEnum,
} from '../enum/portal.enum';
import { localities } from './core';
import { associates } from './savings';
import { tenants } from './tenants';

// ----------------------------------------------------------------------------
// Cuentas de acceso del asociado (realm portal; sin permisos de staff)
// ----------------------------------------------------------------------------
export const portalAccounts = portalSchema.table(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    associateId: uuid('associate_id')
      .references(() => associates.id, { onDelete: 'cascade' })
      .notNull(),

    username: varchar('username', { length: 20 }).notNull(), // = cédula
    passwordHash: text('password_hash').notNull(), // bcrypt

    status: portalAccountStatusEnum('status')
      .notNull()
      .default('PENDING_ACTIVATION'),
    // Decisión de negocio: sin cambio forzado al ingresar
    mustChangePassword: boolean('must_change_password').notNull().default(false),

    email: varchar('email', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    emailVerifiedAt: timestamp('email_verified_at'),
    phoneVerifiedAt: timestamp('phone_verified_at'),

    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until'),
    lastLoginAt: timestamp('last_login_at'),
    passwordChangedAt: timestamp('password_changed_at'),

    deletedAt: timestamp('deleted_at'),
    ...timestampsShort,
  },
  (table) => [
    uniqueIndex('portal_accounts_tenant_associate_uidx')
      .on(table.tenantId, table.associateId)
      .where(sql`deleted_at IS NULL`),
    uniqueIndex('portal_accounts_tenant_username_uidx')
      .on(table.tenantId, table.username)
      .where(sql`deleted_at IS NULL`),
    index('portal_accounts_tenant_idx').on(table.tenantId),
    index('portal_accounts_status_idx').on(table.status),
  ],
);

// ----------------------------------------------------------------------------
// Perfil extendido (dirección libre; el ERP no la soporta)
// ----------------------------------------------------------------------------
export const portalAssociateProfile = portalSchema.table(
  'associate_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .references(() => portalAccounts.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),

    address: text('address'),
    localityId: integer('locality_id').references(() => localities.id, {
      onDelete: 'set null',
    }), // espejo de associates.localityId
    syncedAt: timestamp('synced_at'),

    ...timestampsShort,
  },
  (table) => [index('portal_associate_profile_tenant_idx').on(table.tenantId)],
);

// ----------------------------------------------------------------------------
// Sesiones (realm propio; NO se guarda el refresh token en claro)
// ----------------------------------------------------------------------------
export const portalSessions = portalSchema.table(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .references(() => portalAccounts.id, { onDelete: 'cascade' })
      .notNull(),

    refreshTokenHash: text('refresh_token_hash').notNull(),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at').notNull(),
    previousRefreshTokenHash: text('previous_refresh_token_hash'),
    lastRotatedAt: timestamp('last_rotated_at'),
    rotationCount: integer('rotation_count').notNull().default(0),

    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    deviceFingerprint: text('device_fingerprint'),
    correlationId: uuid('correlation_id'),

    isActive: boolean('is_active').notNull().default(true),
    revokedAt: timestamp('revoked_at'),
    revokedReason: text('revoked_reason'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('portal_sessions_account_idx').on(table.accountId),
    index('portal_sessions_token_hash_idx').on(table.refreshTokenHash),
    index('portal_sessions_is_active_idx').on(table.isActive),
    index('portal_sessions_correlation_idx').on(table.correlationId),
  ],
);

// ----------------------------------------------------------------------------
// Códigos OTP (verificación email/teléfono, reset, step-up)
// ----------------------------------------------------------------------------
export const portalOtpCodes = portalSchema.table(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .references(() => portalAccounts.id, { onDelete: 'cascade' })
      .notNull(),

    purpose: portalOtpPurposeEnum('purpose').notNull(),
    destination: text('destination').notNull(),
    codeHash: text('code_hash').notNull(), // nunca en claro
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    attempts: integer('attempts').notNull().default(0),
    correlationId: uuid('correlation_id'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('portal_otp_account_purpose_idx').on(table.accountId, table.purpose),
    index('portal_otp_expires_idx').on(table.expiresAt),
  ],
);

// ----------------------------------------------------------------------------
// Bitácora de acceso (alternativa: reutilizar audit.audit_events)
// ----------------------------------------------------------------------------
export const portalAccessLog = portalSchema.table(
  'access_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id').references(() => portalAccounts.id, {
      onDelete: 'set null',
    }),
    tenantId: uuid('tenant_id'),

    event: portalAccessEventEnum('event').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    correlationId: uuid('correlation_id'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('portal_access_log_account_idx').on(table.accountId),
    index('portal_access_log_event_idx').on(table.event),
    index('portal_access_log_created_idx').on(table.createdAt),
  ],
);

// ----------------------------------------------------------------------------
// Registro de correos enviados vía Resend (observabilidad / reintentos)
// ----------------------------------------------------------------------------
export const portalEmailLog = portalSchema.table(
  'email_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    accountId: uuid('account_id').references(() => portalAccounts.id, {
      onDelete: 'set null',
    }),

    template: varchar('template', { length: 50 }).notNull(),
    toAddress: varchar('to_address', { length: 100 }).notNull(),
    providerId: varchar('provider_id', { length: 100 }), // message id de Resend
    status: portalEmailStatusEnum('status').notNull().default('QUEUED'),
    error: text('error'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('portal_email_log_account_idx').on(table.accountId),
    index('portal_email_log_status_idx').on(table.status),
  ],
);

// ============================================================================
// Relaciones (para drizzle-orm/relational queries)
// ============================================================================
export const portalAccountsRelations = relations(portalAccounts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [portalAccounts.tenantId],
    references: [tenants.id],
  }),
  associate: one(associates, {
    fields: [portalAccounts.associateId],
    references: [associates.id],
  }),
  profile: one(portalAssociateProfile, {
    fields: [portalAccounts.id],
    references: [portalAssociateProfile.accountId],
  }),
  sessions: many(portalSessions),
  otpCodes: many(portalOtpCodes),
  accessLog: many(portalAccessLog),
  emailLog: many(portalEmailLog),
}));

export const portalAssociateProfileRelations = relations(
  portalAssociateProfile,
  ({ one }) => ({
    account: one(portalAccounts, {
      fields: [portalAssociateProfile.accountId],
      references: [portalAccounts.id],
    }),
    locality: one(localities, {
      fields: [portalAssociateProfile.localityId],
      references: [localities.id],
    }),
  }),
);

export const portalSessionsRelations = relations(portalSessions, ({ one }) => ({
  account: one(portalAccounts, {
    fields: [portalSessions.accountId],
    references: [portalAccounts.id],
  }),
}));

export const portalOtpCodesRelations = relations(portalOtpCodes, ({ one }) => ({
  account: one(portalAccounts, {
    fields: [portalOtpCodes.accountId],
    references: [portalAccounts.id],
  }),
}));
