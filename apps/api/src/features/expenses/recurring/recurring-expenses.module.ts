import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringExpenseTemplatesService } from './recurring-expense-templates.service';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesScheduler } from './recurring-expenses.scheduler';

@Module({
  imports: [DrizzleModule, TenantContextModule, ScheduleModule.forRoot()],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpenseTemplatesService, RecurringExpensesScheduler],
  exports: [RecurringExpenseTemplatesService],
})
export class RecurringExpensesModule {}
