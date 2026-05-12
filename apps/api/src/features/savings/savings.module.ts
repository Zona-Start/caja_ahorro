import { Module } from '@nestjs/common';
import { CreditsFeaturesModule } from './credits/credits.module';
import { LoansFeaturesModule } from './loans/loans.module';
import { AssociatesFeaturesModule } from './parnerts/associatesFeatures.module';
import { SettlementAssociateModule } from './settlement/settlement-associate.module';
import { WithdrawalFeaturesModule } from './withdrawalls/withdrawal.module';

@Module({
  imports: [
    CreditsFeaturesModule,
    LoansFeaturesModule,
    WithdrawalFeaturesModule,
    AssociatesFeaturesModule,
    SettlementAssociateModule,
  ],
})
export class SavingsFeaturesModule {}
