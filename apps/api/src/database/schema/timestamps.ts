import * as t from 'drizzle-orm/pg-core';

export const timestamps = {
  createdBy: t.uuid('created_by'),
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  updatedBy: t.uuid('updated_by'),
  updatedAt: t.timestamp('updated_at').defaultNow().notNull(),
};

export const timestampsShort = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};
