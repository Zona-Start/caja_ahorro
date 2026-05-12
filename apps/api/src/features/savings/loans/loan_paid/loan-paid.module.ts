import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { LoanPaidController } from './loan-paid.controller';
import { LoanPaidService } from './loan-paid.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    PdfGeneratorModule,
    BankMovementsModule,
    TenantContextModule,
  ],
  controllers: [LoanPaidController],
  providers: [LoanPaidService],
  exports: [LoanPaidService],
})
export class LoanPaidModule {}
