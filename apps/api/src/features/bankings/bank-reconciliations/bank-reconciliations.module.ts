import { Module } from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { BankReconciliationsController } from './bank-reconciliations.controller';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';

@Module({
  imports: [AccountingEntriesModule],
  controllers: [BankReconciliationsController],
  providers: [BankReconciliationsService],
  exports: [BankReconciliationsService],
})
export class BankReconciliationsModule {}
