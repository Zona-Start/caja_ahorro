import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { ReimbursementAccountingService } from './reimbursement-accounting.service';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementService } from './reimbursement.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    BankMovementsModule,
    TenantContextModule,
  ],
  controllers: [ReimbursementController],
  providers: [ReimbursementService, ReimbursementAccountingService],
  exports: [ReimbursementService],
})
export class ReimbursementModule {}
