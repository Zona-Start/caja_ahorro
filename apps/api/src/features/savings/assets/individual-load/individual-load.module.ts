import { TenantContextModule } from '@/common/services/tenant-context.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { ContributionBatchesModule } from '../contribution-batches/contribution-batches.module';
import { IndividualLoadController } from './individual-load.controller';
import { IndividualLoadService } from './individual-load.service';

@Module({
  imports: [
    AssociateAccountsMovementsModule,
    BankMovementsModule,
    ContributionBatchesModule,
    TenantContextModule,
  ],
  controllers: [IndividualLoadController],
  providers: [IndividualLoadService],
})
export class IndividualLoadModule {}
