import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogEvent } from '../events/audit-log.event';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogsDto } from './dto/create-audit.dto';

@Injectable()
export class AuditLogsListener {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @OnEvent('audit.log')
  async handleAuditLogEvent(event: AuditLogEvent) {
    const createAuditLogsDto: CreateAuditLogsDto = {
      tableName: event.tableName,
      recordId: event.recordId,
      action: event.action as any,
      userId: event.userId,
      area: event.area,
      description: event.description,
      previousData: event.previousData,
      newData: event.newData,
    };

    await this.auditLogsService.create(createAuditLogsDto);
  }
}
