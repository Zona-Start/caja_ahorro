import { Module } from '@nestjs/common';
import { InventoriesCategoriessModule } from './inventories-categories/inventories-categories.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [InventoriesCategoriessModule, ProductsModule],
})
export class InventoryFeatureModule {}
