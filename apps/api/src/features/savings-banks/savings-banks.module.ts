import { Module } from '@nestjs/common';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociatesModule } from './associates/associates.module';
import { LoansFeaturesModule } from './loans/loans.module';
import { AssociateAccountsMovementsModule } from './associate-accounts-movements/associate-accounts-movements.module';

@Module({
  imports: [AssociatesModule, AssociateAccountsModule, LoansFeaturesModule, AssociateAccountsMovementsModule],
})
export class SavingsBanksFeatureModule {}
