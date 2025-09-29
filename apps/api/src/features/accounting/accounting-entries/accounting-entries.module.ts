import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountingEntriesController } from './accounting-entries.controller';
import { AccountingEntriesService } from './accounting-entries.service';
import { AccountingCyclesService } from '../accounting-cycles/accounting-cycles.service';
import { AccountPlanService } from '../account-plan/account-plan.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AccountingEntriesController],
  providers: [AccountingEntriesService, AccountingCyclesService, AccountPlanService],
  exports: [AccountingEntriesService],
})
export class AccountingEntriesModule {}
