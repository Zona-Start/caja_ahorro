import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  coreSchema,
  savingsSchema,
  tenantSchema,
  treasurySchema,
} from '../_schemas';

/**
 * Subconjunto de solo lectura de tablas del ERP que el portal consulta.
 * (Opción A del plan: definición propia, sin tocar `apps/api`.)
 *
 * Para tipos enum del ERP se usa `text`/`varchar`: node-postgres devuelve los
 * valores de enum como texto, por lo que es seguro para LECTURA y evita drift.
 * NO se usa `.references()` aquí porque estas tablas no se generan con drizzle-kit.
 *
 * Este subconjunto se amplía en el PR de consultas (PR6).
 */

// --- tenant.tenants ----------------------------------------------------------
export const tenants = tenantSchema.table('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  rif: varchar('rif', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  businessType: varchar('business_type', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 63 }),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: varchar('primary_color', { length: 9 }),
  secondaryColor: varchar('secondary_color', { length: 9 }),
  loginMode: varchar('login_mode', { length: 30 }).notNull(),
  isActive: boolean('is_active'),
});

// --- tenant.tenant_domains ---------------------------------------------------
export const tenantDomains = tenantSchema.table('tenant_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false),
});

// --- core.states / municipalities / parishes / localities --------------------
export const states = coreSchema.table('states', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const municipalities = coreSchema.table('municipalities', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  stateId: integer('state_id').notNull(),
});

export const parishes = coreSchema.table('parishes', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  municipalityId: integer('municipality_id').notNull(),
});

export const localities = coreSchema.table(
  'localities',
  {
    id: integer('id').primaryKey(),
    stateId: integer('state_id').notNull(),
    municipalityId: integer('municipality_id').notNull(),
    parishId: integer('parish_id').notNull(),
    name: text('name').notNull(),
  },
  (table) => [
    index('localities_state_idx').on(table.stateId),
    index('localities_municipality_idx').on(table.municipalityId),
    index('localities_parish_idx').on(table.parishId),
  ],
);

// --- savings.associates ------------------------------------------------------
export const associates = savingsSchema.table(
  'associates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cedula: varchar('cedula', { length: 20 }).notNull(),
    fullname: varchar('fullname', { length: 255 }).notNull(),
    nationality: text('nationality').notNull(),
    gender: text('gender'),
    birthdate: date('birthdate'),
    dateAdmission: date('admission_date'),
    dateGraduation: date('graduation_date'),
    discountFrequencyId: uuid('discount_frequency_id'),
    status: text('status').notNull().default('ACTIVE'),
    isPayrollCredit: boolean('is_payroll_credit').notNull().default(false),
    localityId: integer('locality_id'),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 100 }),
    payrollTypeId: uuid('payroll_type_id'),
    associatedTypeId: uuid('associated_type_id'),
    jobTitle: text('job_title'),
    baseSalary: numeric('base_salary', { precision: 20, scale: 6 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    index('associates_cedula_idx').on(table.cedula),
    index('associates_tenant_idx').on(table.tenantId),
  ],
);

// --- treasury.bank_directory -------------------------------------------------
export const bankDirectory = treasurySchema.table(
  'bank_directory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 20 }),
  },
  (table) => [index('bank_directory_name_idx').on(table.name)],
);

// Utilidad: expresión para búsquedas case-insensitive por cédula.
export const cedulaEq = (c: string) => sql`${associates.cedula} = ${c}`;
