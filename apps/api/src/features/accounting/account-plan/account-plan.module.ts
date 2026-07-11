import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AccountPlanController } from './account-plan.controller';
import { AccountPlanService } from './account-plan.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [AccountPlanController],
  providers: [AccountPlanService],
  exports: [AccountPlanService],
})
export class AccountPlanModule {}
