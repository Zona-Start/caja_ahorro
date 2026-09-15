import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountingReportsController } from './accounting-reports.controller';
import { AssociatesBalanceService } from './services/associates-balance.service';
import { BalanceSheetService } from './services/balance-sheet.service';
import { GeneralLedgerService } from './services/general-ledger.service';
import { IncomeStatementService } from './services/income-statement.service';
import { JournalBookService } from './services/journal-book.service';
import { TrialBalanceService } from './services/trial-balance.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, PdfGeneratorModule],
  controllers: [AccountingReportsController],
  providers: [
    JournalBookService,
    GeneralLedgerService,
    TrialBalanceService,
    BalanceSheetService,
    IncomeStatementService,
    AssociatesBalanceService,
  ],
})
export class AccountingReportsModule {}
