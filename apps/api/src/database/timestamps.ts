import * as t from 'drizzle-orm/pg-core';
import { users } from './schema/auth';

export const timestamps = {
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  updatedAt: t
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
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  updatedAt: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};
