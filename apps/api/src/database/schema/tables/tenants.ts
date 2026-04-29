import { timestamps } from '@/database/timestamps';
import {
  boolean,
  index,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenantSchema } from "../_schemas";



export const tenants = tenantSchema.table(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    rif: varchar('rif', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 100 }).notNull(),
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
