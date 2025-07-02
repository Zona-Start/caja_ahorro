import { Module } from '@nestjs/common';
import { SettlementAssociateModule } from './assets/settlement/settlement-associate.module';
import { WithdrawalAssociateModule } from './assets/withdrawal-associate/withdrawal-associate.module';
import { AssociateAccountsMovementsModule } from './associate-accounts-movements/associate-accounts-movements.module';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociateWithdrawalTypesModule } from './associate-withdrawal-types/associate-withdrawal-types.module';
import { AssociatesModule } from './associates/associates.module';
import { CreditsFeaturesModule } from './credits/credits.module';
import { LoansFeaturesModule } from './loans/loans.module';
import { WithdrawalTypesModule } from './assets/withdrawal-types/withdrawal-types.module';

@Module({
  imports: [
    AssociatesModule,
    AssociateAccountsModule,
    LoansFeaturesModule,
    CreditsFeaturesModule,
    AssociateAccountsMovementsModule,
    AssociateWithdrawalTypesModule,
    WithdrawalAssociateModule,
    SettlementAssociateModule,
    WithdrawalTypesModule,
  ],
})
export class SavingsBanksFeatureModule {}
