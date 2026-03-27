import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { AuditLogsModule } from '@/features/audit/audit-logs/audit-logs.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { LoanDisbursementController } from './loan-disbursement.controller';
import { LoanDisbursementService } from './loan-disbursement.service';

@Module({
  imports: [
    DrizzleModule,
    BankMovementsModule,
    AssociateAccountsMovementsModule,
    AuditLogsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    SettingsSystemModule,
  ],
  controllers: [LoanDisbursementController],
  providers: [LoanDisbursementService],
  exports: [LoanDisbursementService],
})
export class LoanDisbursementModule {}
