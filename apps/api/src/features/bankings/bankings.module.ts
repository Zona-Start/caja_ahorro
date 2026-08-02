import { Module } from '@nestjs/common';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankDirectoryModule } from './bank-directory/bank-directory.module';
import { BankMovementsModule } from './bank-movements/bank-movements.module';
import { BankReconciliationsModule } from './bank-reconciliations/bank-reconciliations.module';
import { BankingReportsModule } from './reports/banking-reports.module';
import { GlobalBankingSubscriber } from './subscribers/global-banking.subscriber';

@Module({
  imports: [
    BankDirectoryModule,
    BankAccountsModule,
    BankMovementsModule,
    BankReconciliationsModule,
    BankingReportsModule,
  ],
  providers: [GlobalBankingSubscriber],
})
export class BankingsModule {}
