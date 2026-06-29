import { Module } from '@nestjs/common';
import { CreditsFeaturesModule } from './credits/credits.module';
import { LoansFeaturesModule } from './loans/loans.module';
import { AssociatesFeaturesModule } from './parnerts/associatesFeatures.module';
import { SettlementAssociateModule } from './settlement/settlement-associate.module';
import { WithdrawalFeaturesModule } from './withdrawalls/withdrawal.module';
import { IndividualLoadModule } from './assets/individual-load/individual-load.module';
import { ContributionBatchesModule } from './assets/contribution-batches/contribution-batches.module';

@Module({
  imports: [
    CreditsFeaturesModule,
    LoansFeaturesModule,
    WithdrawalFeaturesModule,
    AssociatesFeaturesModule,
    SettlementAssociateModule,
    IndividualLoadModule,
    ContributionBatchesModule,
  ],
})
export class SavingsFeaturesModule { }
