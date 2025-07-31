import { Module } from '@nestjs/common';
import { InventoriesCategoriessModule } from './inventories-categories/inventories-categories.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [InventoriesCategoriessModule, ProductsModule, ServicesModule],
})
export class InventoryFeatureModule {}
