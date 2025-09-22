import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditLogsModule } from '@/features/audit/audit-logs/audit-logs.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { PaymentBatchesController } from './payment-batches.controller';
import { PaymentBatchesService } from './payment-batches.service';

@Module({
  imports: [
    DrizzleModule,
    BankMovementsModule,
    AssociateAccountsMovementsModule,
    AuditLogsModule,
    GenerateCodeModule,
    SettingsSystemModule,
  ],
  controllers: [PaymentBatchesController],
  providers: [PaymentBatchesService],
  exports: [PaymentBatchesService],
})
export class PaymentBatchesModule {}
