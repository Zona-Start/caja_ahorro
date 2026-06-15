import { timestamps } from '@/database/timestamps';
import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenantSchema } from '../_schemas';
import {
  businessTypeEnum,
  moduleCodeEnum,
  moduleStatusEnum,
} from '../enum/core.enum';

export const tenants = tenantSchema.table(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    rif: varchar('rif', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull(),
    businessType: businessTypeEnum('business_type')
      .notNull()
      .default('CAJA_AHORRO'),
    address: text('address'),
    phone: varchar('phone', { length: 50 }),
    contactName: varchar('contact_name', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    contactEmail: varchar('contact_email', { length: 100 }),
    contactCedula: varchar('contact_cedula', { length: 20 }),
    isActive: boolean('is_active').default(true),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tenants_rif_idx').on(table.rif),
    index('tenants_business_type_idx').on(table.businessType),
    index('tenants_active_idx').on(table.isActive),
  ],
);

export const tenantSettings = tenantSchema.table(
  'tenant_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value'),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull().default('general'),
    ...timestamps,
  },
  (table) => [
    index('tenant_settings_tenant_idx').on(table.tenantId),
    uniqueIndex('tenant_settings_key_idx').on(table.tenantId, table.key),
  ],
);

export const tenantModules = tenantSchema.table(
  'tenant_modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    moduleCode: moduleCodeEnum('module_code').notNull(),
    status: moduleStatusEnum('status').notNull().default('ENABLED'),
    activatedAt: timestamp('activated_at').defaultNow().notNull(),
    activatedBy: uuid('activated_by'),
    deactivatedAt: timestamp('deactivated_at'),
    deactivatedBy: uuid('deactivated_by'),
    settings: jsonb('settings'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('tenant_modules_tenant_module_idx').on(
      table.tenantId,
      table.moduleCode,
    ),
    index('tenant_modules_tenant_idx').on(table.tenantId),
    index('tenant_modules_status_idx').on(table.status),
  ],
);

export const tenantModuleIntegrations = tenantSchema.table(
  'tenant_module_integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    sourceModule: moduleCodeEnum('source_module').notNull(),
    targetModule: moduleCodeEnum('target_module').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(false),
    config: jsonb('config'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('tenant_module_integrations_uidx').on(
      table.tenantId,
      table.sourceModule,
      table.targetModule,
    ),
    index('tenant_module_integrations_tenant_idx').on(table.tenantId),
    index('tenant_module_integrations_source_idx').on(table.sourceModule),
    index('tenant_module_integrations_target_idx').on(table.targetModule),
  ],
);
