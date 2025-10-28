import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { AccountingCyclesModule } from './accounting-cycles/accounting-cycles.module';
import { AccountingEntriesModule } from './accounting-entries/accounting-entries.module';
import { AccountingConfigurationsModule } from './accounting-configurations/accounting-configurations.module';

@Module({
  imports: [
    AccountPlanModule,
    AccountingCyclesModule,
    AccountingEntriesModule,
    AccountingConfigurationsModule,
  ],
  exports: [AccountPlanModule, AccountingEntriesModule],
})
export class AccountingModule {}
