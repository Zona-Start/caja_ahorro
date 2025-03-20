import { sql } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { actionEnum } from './enum';

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

//Tabla de Auditoría registrará todos los cambios importantes en las transacciones financieras, como inserciones, actualizaciones o eliminaciones.
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: t.serial('id').primaryKey(),
    tableName: t.text('table_name').notNull(), //tabla afectada.
    recordId: t.uuid('record_id').notNull(), //asociar el cambio con un registro específico
    action: actionEnum('action').notNull(), // con restricción para aceptar solo 'INSERT', 'UPDATE' o 'DELETE'.
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    area: t.text('area').notNull(), //para especificar la unidad responsable
    description: t.text('description').notNull(),
    timestamp: t.timestamp('timestamp').defaultNow(), //con fecha y hora del cambio
    previousData: t.jsonb('previous_data'), //para guardar los estados antes de la modificación
    newData: t.jsonb('new_data'), // para guardar los estados después de la modificación
    ...timestamps,
  },
  (auditLogs) => ({
    auditLogsIdx0: index('auditLogs_idx00').on(auditLogs.tableName),
    auditLogsIdx1: index('auditLogs_idx01').on(auditLogs.recordId),
    auditLogsIdx2: index('auditLogs_idx02').on(auditLogs.action),
    auditLogsIdx3: index('auditLogs_idx03').on(auditLogs.area),
    auditLogsIdx4: index('auditLogs_idx04').on(auditLogs.timestamp),
  }),
);
