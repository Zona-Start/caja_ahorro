import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule, InvoicesModule, PurchaseOrdersModule],
})
export class AccountsPayableModule {}
