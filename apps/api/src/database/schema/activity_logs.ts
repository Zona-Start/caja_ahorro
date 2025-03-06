import * as t from 'drizzle-orm/pg-core';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de Logs de Actividad
export const activityLogsSystem = pgTable(
  'activity_logs',
  {
    id: t
      .uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    type: t.text('type').notNull(), // login, failed
    description: t.text('description').notNull(),
    timestamp: t.timestamp('timestamp').defaultNow(),
    ...timestamps,
  },
  (activityLogs) => ({
    activityLogsIdx: index('activityLogs_idx').on(activityLogs.type),
  }),
);
