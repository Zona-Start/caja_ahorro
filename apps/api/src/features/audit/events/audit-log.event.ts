import { ActionEnumAudit } from '@/types/enum';

export class AuditLogEvent {
  tableName: string;
  recordId: string;
  action: ActionEnumAudit | string;
  userId: number;
  area: string;
  description: string;
  previousData?: any;
  newData?: any;

  constructor(partial: Partial<AuditLogEvent>) {
    Object.assign(this, partial);
  }
}
