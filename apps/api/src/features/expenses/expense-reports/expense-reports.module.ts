import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { ExpenseReportsController } from './expense-reports.controller';
import { ExpenseReportsService } from './expense-reports.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AccountingEntriesModule],
  controllers: [ExpenseReportsController],
  providers: [ExpenseReportsService],
  exports: [ExpenseReportsService],
})
export class ExpenseReportsModule {}
