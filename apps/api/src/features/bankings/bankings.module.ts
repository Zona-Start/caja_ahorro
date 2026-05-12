import { Module } from '@nestjs/common';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankDirectoryModule } from './bank-directory/bank-directory.module';
//import { BankMovementsModule } from './bank-movements/bank-movements.module';
import { BankReconciliationsModule } from './bank-reconciliations/bank-reconciliations.module';

@Module({
  imports: [
    BankDirectoryModule,
    BankAccountsModule,
    //BankMovementsModule,
    BankReconciliationsModule,
  ],
})
export class BankingsModule {}
