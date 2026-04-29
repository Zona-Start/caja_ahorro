import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AccountingCyclesController } from './accounting-cycles.controller';
import { AccountingCyclesService } from './accounting-cycles.service';

@Module({
  imports: [DrizzleModule, AuditModule, TenantContextModule],
  controllers: [AccountingCyclesController],
  providers: [AccountingCyclesService],
  exports: [AccountingCyclesService],
})
export class AccountingCyclesModule {}
