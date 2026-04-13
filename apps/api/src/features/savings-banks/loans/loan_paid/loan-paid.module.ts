import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { forwardRef, Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { LoanPaidController } from './loan-paid.controller';
import { LoanPaidService } from './loan-paid.service';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';

import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    PdfGeneratorModule
  ],
  controllers: [LoanPaidController],
  providers: [LoanPaidService],
  exports: [LoanPaidService],
})
export class LoanPaidModule {}
