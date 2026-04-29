import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AccountingRulesController } from './accounting-rules.controller';
import { AccountingRulesService } from './accounting-rules.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [AccountingRulesController],
  providers: [AccountingRulesService],
  exports: [AccountingRulesService],
})
export class AccountingRulesModule {}
