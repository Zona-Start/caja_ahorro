import { Module } from '@nestjs/common';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module';
import { InventoriesCategoriesModule } from './inventories-categories/inventories-categories.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';
import { ProductServiceSuppliersModule } from './product-service-suppliers/product-service-suppliers.module';
import { GlobalInventorySubscriber } from './subscribers/global-inventory.subscriber';

@Module({
  imports: [
    InventoriesCategoriesModule,
    ProductsModule,
    ServicesModule,
    FixedAssetsModule,
    InventoryMovementsModule,
    ProductServiceSuppliersModule,
  ],
  providers: [GlobalInventorySubscriber],
})
export class InventoryFeatureModule {}
