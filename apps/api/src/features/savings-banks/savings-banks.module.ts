import { Module } from '@nestjs/common';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociatesModule } from './associates/associates.module';
import { LoansFeaturesModule } from './loans/loans.module';

@Module({
  imports: [AssociatesModule, AssociateAccountsModule, LoansFeaturesModule],
})
export class SavingsBanksFeatureModule {}
