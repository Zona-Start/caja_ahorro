import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule, InvoicesModule],
})
export class AccountsPayableModule {}
