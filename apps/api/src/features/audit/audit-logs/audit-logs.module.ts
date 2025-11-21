import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsListener } from './audit-logs.listener';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsListener],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
