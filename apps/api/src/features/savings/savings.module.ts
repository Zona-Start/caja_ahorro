import { Module } from '@nestjs/common';
import { ContributionBatchesModule } from './assets/contribution-batches/contribution-batches.module';
import { IndividualLoadModule } from './assets/individual-load/individual-load.module';
import { PaymentBatchesModule } from './assets/payment-batches/payment-batches.module';
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
    IndividualLoadModule,
    ContributionBatchesModule,
    PaymentBatchesModule,
  ],
})
export class SavingsFeaturesModule {}
