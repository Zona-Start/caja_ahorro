import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { AccountingBalanceModule } from './accounting-balances/accounting-balance.module';
import { AccountingCyclesModule } from './accounting-cycles/accounting-cycles.module';
import { AccountingEntriesModule } from './accounting-entries/accounting-entries.module';
import { AccountingReportsModule } from './accounting-reports/accounting-reports.module';
import { AccountingRulesModule } from './accounting-rules/accounting-rules.module';
import { GlobalAccountingSubscriber } from './subscribers/global-accounting.subscriber';

@Module({
  imports: [
    AccountPlanModule,
    AccountingCyclesModule,
    AccountingEntriesModule,
    AccountingBalanceModule,
    AccountingReportsModule,
    AccountingRulesModule,
  ],
  providers: [GlobalAccountingSubscriber],
  exports: [AccountPlanModule, AccountingEntriesModule],
})
export class AccountingFeaturesModule {}
