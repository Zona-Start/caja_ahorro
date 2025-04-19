import { Module } from '@nestjs/common';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ActivityLogsSystemModule } from './activity-logs-system/activity-logs-system.module';


@Module({
  imports: [
    AuditLogsModule,
    ActivityLogsSystemModule
  ],
})
export class AuditModule {}