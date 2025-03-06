import * as t from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authSchema } from './schemas';
import { users } from './users';

const timestamps = {
  created_at: t.timestamp('created_at').defaultNow().notNull(),
  updated_at: t
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

// Tabla de Sesiones
export const sessions = authSchema.table(
  'sessions',
  {
    id: t
      .uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: t
      .uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sessionToken: t.text('session_token').notNull(),
    expiresAt: t.integer('expires_at').notNull(),
    ...timestamps,
  },
  (sessions) => ({
    sessionsIdx: index('sessions_idx').on(sessions.sessionToken),
  }),
);
