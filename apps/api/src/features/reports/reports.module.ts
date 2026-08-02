import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AssociatesReportService } from './services/associates-report.service';
import { HaberesReportService } from './services/haberes-report.service';
import { WithdrawalsReportService } from './services/withdrawals-report.service';
import { VariationsReportService } from './services/variations-report.service';
import { LoansReportService } from './services/loans-report.service';
import { QuotasReportService } from './services/quotas-report.service';
import { CreditsReportService } from './services/credits-report.service';
import { CreditQuotasReportService } from './services/credit-quotas-report.service';
import { PurchasingReportsService } from './services/purchasing-reports.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, PdfGeneratorModule],
  controllers: [ReportsController],
  providers: [
    AssociatesReportService,
    HaberesReportService,
    WithdrawalsReportService,
    VariationsReportService,
    LoansReportService,
    QuotasReportService,
    CreditsReportService,
    CreditQuotasReportService,
    PurchasingReportsService,
  ],
})
export class ReportsModule {}
