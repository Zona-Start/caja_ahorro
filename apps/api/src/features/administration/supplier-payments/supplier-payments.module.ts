import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AccountsPayableModule } from '../accounts-payable/accounts-payable.module';
import { SupplierInvoicesModule } from '../supplier-invoices/supplier-invoices.module';
import { SupplierPaymentsController } from './supplier-payments.controller';
import { SupplierPaymentsService } from './supplier-payments.service';

@Module({
  imports: [
    DrizzleModule,
    AccountsPayableModule,
    BankMovementsModule,
    GenerateCodeModule,
    SupplierInvoicesModule,
  ],
  controllers: [SupplierPaymentsController],
  providers: [SupplierPaymentsService],
  exports: [SupplierPaymentsService],
})
export class SupplierPaymentsModule {}
