import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import {
  AuditEventService,
  AuditHelper,
  SystemEventHelper,
} from './audit-event.service';
import { AuditLogListener } from './events/audit-log.listener';

@Module({
  imports: [DrizzleModule],
  providers: [
    AuditEventService,
    AuditHelper,
    SystemEventHelper,
    AuditLogListener,
  ],
  exports: [AuditEventService, AuditHelper, SystemEventHelper],
})
export class AuditModule {}
