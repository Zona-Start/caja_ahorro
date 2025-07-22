import { Module } from '@nestjs/common';

import { InventoryFeatureModule } from './inventory/inventory-module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SupplierInvoicesModule } from './supplier-invoices/supplier-invoices.module';
import { AccountsPayableModule } from './accounts-payable/accounts-payable.module';
import { SupplierTransactionsModule } from './supplier-transactions/supplier-transactions.module';

@Module({
  imports: [
    SuppliersModule,
    InventoryFeatureModule,
    PurchaseOrdersModule,
    SupplierInvoicesModule,
    AccountsPayableModule,
    SupplierTransactionsModule,
  ],
})
export class AdministrationFeaturesModule {}
