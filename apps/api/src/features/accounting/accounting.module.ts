import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { AccountingCyclesModule } from './accounting-cycles/accounting-cycles.module';

@Module({
  imports: [AccountPlanModule, AccountingCyclesModule],
  exports: [AccountPlanModule],
})
export class AccountingModule {}
