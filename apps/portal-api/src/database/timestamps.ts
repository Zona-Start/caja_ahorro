import * as t from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  updatedAt: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
  createdById: t.uuid('created_by_id'),
  updatedById: t.uuid('updated_by_id'),
};

export const timestampsShort = {
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  updatedAt: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};
