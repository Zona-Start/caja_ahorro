import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { SettlementAssociateModule } from '../../settlement/settlement-associate.module';
import { WithdrawalAssociateModule } from '../../withdrawalls/withdrawal-associate/withdrawal-associate.module';
import { PaymentBatchesController } from './payment-batches.controller';
import { PaymentBatchesService } from './payment-batches.service';

@Module({
  imports: [
    BankMovementsModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    SettlementAssociateModule,
    WithdrawalAssociateModule,
    TenantContextModule,
  ],
  controllers: [PaymentBatchesController],
  providers: [PaymentBatchesService],
  exports: [PaymentBatchesService],
})
export class PaymentBatchesModule {}
