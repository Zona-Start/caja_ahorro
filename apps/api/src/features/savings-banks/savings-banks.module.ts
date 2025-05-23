import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from './associate-accounts-movements/associate-accounts-movements.module';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociatesModule } from './associates/associates.module';
import { LoansFeaturesModule } from './loans/loans.module';

@Module({
  imports: [
    AssociatesModule,
    AssociateAccountsModule,
    LoansFeaturesModule,
    AssociateAccountsMovementsModule,
  ],
})
export class SavingsBanksFeatureModule {}
