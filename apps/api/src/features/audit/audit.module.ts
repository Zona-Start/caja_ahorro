import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import {
  AuditEventService,
  AuditHelper,
  SystemEventHelper,
} from './audit-event.service';

@Module({
  imports: [DrizzleModule],
  providers: [AuditEventService, AuditHelper, SystemEventHelper],
  exports: [AuditEventService, AuditHelper, SystemEventHelper],
})
export class AuditModule {}
