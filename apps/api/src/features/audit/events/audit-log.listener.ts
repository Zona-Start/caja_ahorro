import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditEventService } from '../audit-event.service';
import { AuditLogEvent } from './audit-log.event';

@Injectable()
export class AuditLogListener {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly auditEventService: AuditEventService) {}

  @OnEvent('audit.log')
  async handleAuditLog(event: AuditLogEvent) {
    try {
      const tenantId =
        typeof event.tenantId === 'string' ? event.tenantId : undefined;
      const userId =
        typeof event.userId === 'string' ? event.userId : String(event.userId ?? '');

      await this.auditEventService.emit({
        action: event.action,
        targetType: event.tableName,
        targetId: event.recordId,
        userId: userId || undefined,
        tenantId,
        description: event.description,
        previousValues: event.previousData as Record<string, any> | undefined,
        newValues: event.newData as Record<string, any> | undefined,
        metadata: { area: event.area },
      });
    } catch (error) {
      this.logger.error(
        `No se pudo procesar el evento de auditoria (audit.log): ${error}`,
      );
    }
  }
}