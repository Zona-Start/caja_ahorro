import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from './associate-accounts-movements/associate-accounts-movements.module';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociateWithdrawalTypesModule } from './associate-withdrawal-types/associate-withdrawal-types.module';
import { AssociatesModule } from './associates/associates.module';
import { CreditsFeaturesModule } from './credits/credits.module';
import { LoansFeaturesModule } from './loans/loans.module';

@Module({
  imports: [
    AssociatesModule,
    AssociateAccountsModule,
    LoansFeaturesModule,
    CreditsFeaturesModule,
    AssociateAccountsMovementsModule,
    AssociateWithdrawalTypesModule,
  ],
})
export class SavingsBanksFeatureModule {}
