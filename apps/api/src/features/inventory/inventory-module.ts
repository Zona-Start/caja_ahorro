import { Module } from '@nestjs/common';
import { SalesProductCategoriesModule } from './sales/sales-product-categories/sales-product-categories.module';

@Module({
  imports: [SalesProductCategoriesModule],
})
export class InventoryFeatureModule {}
