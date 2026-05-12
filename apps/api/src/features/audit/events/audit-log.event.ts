export interface AuditLogEventData {
  tableName: string;
  recordId: string;
  action: string;
  userId: string | number;
  area: string;
  description: string;
  newData?: unknown;
  previousData?: unknown;
  tenantId?: string | number;
}

export class AuditLogEvent {
  tableName: string;
  recordId: string;
  action: string;
  userId: string | number;
  area: string;
  description: string;
  newData?: unknown;
  previousData?: unknown;
  tenantId?: string | number;

  constructor(init: AuditLogEventData) {
    Object.assign(this, init);
  }
}
