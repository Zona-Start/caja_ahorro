import { DrizzleModule } from '@/database/drizzle.module';
import { AuditLogsModule } from '@/features/audit/audit-logs/audit-logs.module';
import { AssociateAccountsMovementsModule } from '@/features/savings-banks/associate-accounts-movements/associate-accounts-movements.module';
import { forwardRef, Module } from '@nestjs/common';
import { BankMovementsController } from './bank-movements.controller';
import { BankMovementsService } from './bank-movements.service';
import { LoanPaidModule } from '@/features/savings-banks/loans/loan_paid/loan-paid.module';
import { CreditPaidModule } from '@/features/savings-banks/credits/credit-paid/credit-paid.module';

@Module({
  imports: [
    DrizzleModule,
    AuditLogsModule,
    AssociateAccountsMovementsModule,
    forwardRef(() => LoanPaidModule),
    forwardRef(() => CreditPaidModule),
  ],
  controllers: [BankMovementsController],
  providers: [BankMovementsService],
  exports: [BankMovementsService],
})
export class BankMovementsModule {}
