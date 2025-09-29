import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { AccountingCyclesModule } from './accounting-cycles/accounting-cycles.module';
import { AccountingEntriesModule } from './accounting-entries/accounting-entries.module';

@Module({
  imports: [AccountPlanModule, AccountingCyclesModule, AccountingEntriesModule],
  exports: [AccountPlanModule, AccountingEntriesModule],
})
export class AccountingModule {}
