import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AccountPlanService } from '../account-plan/account-plan.service';
import { AccountingCyclesService } from '../accounting-cycles/accounting-cycles.service';
import { AccountingEntriesController } from './accounting-entries.controller';
import { AccountingEntriesService } from './accounting-entries.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [AccountingEntriesController],
  providers: [
    AccountingEntriesService,
    AccountingCyclesService,
    AccountPlanService,
  ],
  exports: [AccountingEntriesService],
})
export class AccountingEntriesModule {}
