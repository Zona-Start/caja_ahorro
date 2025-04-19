import { sql } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { timestampsShort } from '../timestamps';
import { users } from './auth';
import { actionEnumAudit } from './enum';
import { auditSchema, coreSchema } from './schemas';

// Tabla de Logs de Actividad
export const activityLogsSystem = coreSchema.table(
  'activity_logs',
  {
    id: t
      .uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    type: actionEnumAudit('action').notNull(), // login, failed
    description: t.text('description').notNull(),
    timestamp: t.timestamp('timestamp').defaultNow(),
    ...timestampsShort,
  },
  (activityLogs) => ({
    activityLogsIdx: index('activityLogs_idx').on(activityLogs.type),
  }),
);

//Tabla de Auditoría registrará todos los cambios importantes en las transacciones financieras, como inserciones, actualizaciones o eliminaciones.
export const auditLogs = auditSchema.table(
  'audit_logs',
  {
    id: t.serial('id').primaryKey(),
    tableName: t.text('table_name').notNull(), //tabla afectada.
    recordId: t.text('record_id').notNull(), //asociar el cambio con un registro específico
    action: actionEnumAudit('action').notNull(), // con restricción para aceptar solo 'INSERT', 'UPDATE' o 'DELETE'.
    userId: t
      .integer('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    area: t.text('area').notNull(), //para especificar la unidad responsable
    description: t.text('description').notNull(),
    timestamp: t.timestamp('timestamp').defaultNow(), //con fecha y hora del cambio
    previousData: t.jsonb('previous_data'), //para guardar los estados antes de la modificación
    newData: t.jsonb('new_data'), // para guardar los estados después de la modificación
    ...timestampsShort,
  },
  (auditLogs) => ({
    tableNameIdx: index('auditLogs_table_name_idx').on(auditLogs.tableName),
    recordIdIdx: index('auditLogs_record_idx').on(auditLogs.recordId),
    actionIdx: index('auditLogs_action_idx').on(auditLogs.action),
    areaIdx: index('auditLogs_area_idx').on(auditLogs.area),
  }),
);
