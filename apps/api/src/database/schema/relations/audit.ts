import { relations } from 'drizzle-orm';
import { auditEvents, systemEvents } from '../tables/audit';
import { users } from '../tables/auth';
import { tenants } from '../tables/tenants';

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditEvents.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}));

export const systemEventsRelations = relations(systemEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [systemEvents.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [systemEvents.userId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [systemEvents.resolvedBy],
    references: [users.id],
    relationName: 'systemEventResolvedBy',
  }),
}));
