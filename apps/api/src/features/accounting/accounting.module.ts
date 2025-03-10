import { Module } from '@nestjs/common';
import { AccountPlanModule } from './account-plan/account-plan.module';
import { TransactionsCountableModule } from './transactions-countable/transactions-countable.module';
import { MovementsCountableModule } from './movements-countable/movements-countable.module';

@Module({
  imports: [
    AccountPlanModule,
    TransactionsCountableModule,
    MovementsCountableModule,
  ],
  exports: [
    AccountPlanModule,
    TransactionsCountableModule,
    MovementsCountableModule,
  ],
})
export class AccountingModule {}