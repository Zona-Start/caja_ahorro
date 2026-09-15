import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExchangeRateModule } from '@/features/core/exchange-rate/exchange-rate.module';

@Module({
  imports: [DrizzleModule, TenantContextModule, AccountingEntriesModule, ExchangeRateModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule { }
