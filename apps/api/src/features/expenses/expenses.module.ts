import { Module } from '@nestjs/common';
import { CashMovementsModule } from './cash-movements/cash-movements.module';
import { CashRegistersModule } from './cash-registers/cash-registers.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpenseReportsModule } from './expense-reports/expense-reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PettyCashSettlementsModule } from './petty-cash-settlements/petty-cash-settlements.module';
import { PettyCashVouchersModule } from './petty-cash-vouchers/petty-cash-vouchers.module';
import { PettyCashModule } from './petty-cash/petty-cash.module';
import { RecurringExpensesModule } from './recurring/recurring-expenses.module';

@Module({
  imports: [
    CashRegistersModule,
    CashSessionsModule,
    CashMovementsModule,
    CostCentersModule,
    ExpenseCategoriesModule,
    PettyCashModule,
    PettyCashVouchersModule,
    PettyCashSettlementsModule,
    RecurringExpensesModule,
    ExpenseReportsModule,
    ExpensesModule,
  ],
})
export class ExpensesFeatureModule {}
