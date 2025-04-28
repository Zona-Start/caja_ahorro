import { Module } from '@nestjs/common';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankDirectoryModule } from './bank-directory/bank-directory.module';

@Module({
  imports: [BankDirectoryModule, BankAccountsModule],
})
export class BankingsModule {}
