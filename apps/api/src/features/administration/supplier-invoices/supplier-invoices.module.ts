import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AccountsPayableModule } from '../accounts-payable/accounts-payable.module';
import { FixedAssetPricesModule } from '../inventory/fixed-asset-prices/fixed-asset-prices.module';
import { InventoryMovementsModule } from '../inventory/inventory-movements/inventory-movements.module';
import { ProductPricesModule } from '../inventory/product-prices/product-prices.module';
import { ServicePricesModule } from '../inventory/services-prices/services-prices.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
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
    BankMovementsModule,
    GenerateCodeModule,
  ],
  controllers: [SupplierInvoicesController],
  providers: [SupplierInvoicesService],
})
export class SupplierInvoicesModule {}
