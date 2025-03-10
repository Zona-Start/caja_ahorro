import { Module } from '@nestjs/common';
import { SavingsBankModule } from './savings-bank/savings-bank.module';
import { AssociatesModule } from './associates/associates.module';
import { AccountsAssociatesModule } from './accounts-associates/accounts-associates.module';

@Module({
  imports: [
    SavingsBankModule,
    AssociatesModule,
    AccountsAssociatesModule,
  ],
})
export class SavingsBankFeatureModule {}