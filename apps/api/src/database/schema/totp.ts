import * as t from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';
import { primaryKey } from 'drizzle-orm/pg-core';

//tabla de tokens de verificación
export const verificationTokens = authSchema.table(
  'verificationToken',
  {
    identifier: t.text('identifier').notNull(),
    token: t.text('token').notNull(),
    code: t.integer('code'),
    expires: t.timestamp('expires', { mode: 'date' }).notNull(),
    ipAddress: t.text('ip_address').notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);
