import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { AccountingBalanceModule } from './accounting-balances/accounting-balance.module';
import { AccountingConfigurationsModule } from './accounting-configurations/accounting-configurations.module';
import { AccountingCyclesModule } from './accounting-cycles/accounting-cycles.module';
import { AccountingEntriesModule } from './accounting-entries/accounting-entries.module';
import { AccountingRulesModule } from './accounting-rules/accounting-rules.module';

@Module({
  imports: [
    AccountPlanModule,
    AccountingCyclesModule,
    AccountingEntriesModule,
    AccountingConfigurationsModule,
    AccountingBalanceModule,
    AccountingRulesModule,
  ],
  exports: [AccountPlanModule, AccountingEntriesModule],
})
export class AccountingModule {}
