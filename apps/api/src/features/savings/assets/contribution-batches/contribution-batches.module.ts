import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { AuditModule } from '@/features/audit/audit.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { ContributionBatchesAccountingService } from './contribution-batches-accounting.service';
import { ContributionBatchesController } from './contribution-batches.controller';
import { ContributionBatchesService } from './contribution-batches.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    AuditModule,
    AssociateAccountsMovementsModule,
    BankMovementsModule,
    AccountingEntriesModule,
  ],
  controllers: [ContributionBatchesController],
  providers: [ContributionBatchesService, ContributionBatchesAccountingService],
  exports: [ContributionBatchesService, ContributionBatchesAccountingService],
})
export class ContributionBatchesModule {}
