import * as t from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

// Tabla States
export const banks = t.pgTable(
  'banks',
  {
    id: t.serial('id').primaryKey(),
    code: t.varchar('code', { length: 5 }).notNull(),
    name: t.text('name').notNull(),
    ...timestamps,
  },
  (banks) => ({
    nameIndex: t.index('banks_index_00').on(banks.code, banks.name),
  }),
);
