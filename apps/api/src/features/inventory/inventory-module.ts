import { Module } from '@nestjs/common';
import { FixedAssetsCategoriesModule } from './assets/fixed-assets-categories/fixed-assets-categories.module';
import { FixedAssetsMaintenancesModule } from './assets/fixed-assets-maintenances/fixed-assets-maintenances.module';
import { FixedAssetsModule } from './assets/fixed-assets/fixed-assets.module';
import { SalesProductCategoriesModule } from './sales/sales-product-categories/sales-product-categories.module';
import { SalesProductPurchasesModule } from './sales/sales-product-purchases/sales-product-purchases.module';
import { SalesProductsModule } from './sales/sales-products/sales-products.module';

@Module({
  imports: [
    FixedAssetsCategoriesModule,
    FixedAssetsMaintenancesModule,
    FixedAssetsModule,
    SalesProductCategoriesModule,
    SalesProductsModule,
    SalesProductPurchasesModule,
  ],
})
export class InventoryFeatureModule {}
