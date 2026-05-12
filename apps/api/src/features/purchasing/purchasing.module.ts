import { Module } from '@nestjs/common';

import { AccountsPayableModule } from './accounts-payable/accounts-payable.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SupplierInvoicesModule } from './supplier-invoices/supplier-invoices.module';
import { SupplierPaymentsModule } from './supplier-payments/supplier-payments.module';
import { SupplierTransactionsModule } from './supplier-transactions/supplier-transactions.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    SuppliersModule,
    PurchaseOrdersModule,
    SupplierInvoicesModule,
    AccountsPayableModule,
    SupplierTransactionsModule,
    SupplierPaymentsModule,
  ],
})
export class PurchasingFeaturesModule {}
