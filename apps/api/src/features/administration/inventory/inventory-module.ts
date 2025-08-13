import { Module } from '@nestjs/common';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module';
import { InventoriesCategoriessModule } from './inventories-categories/inventories-categories.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    InventoriesCategoriessModule,
    ProductsModule,
    ServicesModule,
    FixedAssetsModule,
  ],
})
export class InventoryFeatureModule {}
