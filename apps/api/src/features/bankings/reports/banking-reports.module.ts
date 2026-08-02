import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { BankingReportsController } from './banking-reports.controller';
import { BankingReportsService } from './banking-reports.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, PdfGeneratorModule],
  controllers: [BankingReportsController],
  providers: [BankingReportsService],
})
export class BankingReportsModule {}
