import { Module } from '@nestjs/common';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module';
import { InventoriesCategoriesModule } from './inventories-categories/inventories-categories.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    InventoriesCategoriesModule,
    ProductsModule,
    ServicesModule,
    FixedAssetsModule,
    InventoryMovementsModule,
  ],
})
export class InventoryFeatureModule {}
