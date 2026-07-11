import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { FixedAssetPricesModule } from '../../inventory/fixed-asset-prices/fixed-asset-prices.module';
import { InventoryMovementsModule } from '../../inventory/inventory-movements/inventory-movements.module';
import { ProductPricesModule } from '../../inventory/product-prices/product-prices.module';
import { ServicePricesModule } from '../../inventory/services-prices/services-prices.module';
import { AccountsPayableModule } from '../accounts-payable/accounts-payable.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { SupplierTransactionsModule } from '../supplier-transactions/supplier-transactions.module';
import { SupplierInvoicesController } from './supplier-invoices.controller';
import { SupplierInvoicesService } from './supplier-invoices.service';

@Module({
  imports: [
    DrizzleModule,
    InventoryMovementsModule,
    ProductPricesModule,
    ServicePricesModule,
    FixedAssetPricesModule,
    PurchaseOrdersModule,
    AccountsPayableModule,
    GenerateCodeModule,
    SupplierTransactionsModule,
    TenantContextModule,
    AccountingEntriesModule,
  ],
  controllers: [SupplierInvoicesController],
  providers: [SupplierInvoicesService],
  exports: [SupplierInvoicesService],
})
export class SupplierInvoicesModule {}
