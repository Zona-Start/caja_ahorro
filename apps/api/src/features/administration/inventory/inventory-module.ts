import { Module } from '@nestjs/common';
import { InventoriesCategoriessModule } from './inventories-categories/inventories-categories.module';
import { ProductsModule } from './products/products.module';
import { ProductPricesModule } from './product-prices/product-prices.module';
import { ServicesModule } from './services/services.module';
import { ProductServiceSuppliersModule } from './product-service-suppliers/product-service-suppliers.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';

@Module({
  imports: [InventoriesCategoriessModule, ProductsModule, ProductPricesModule, ServicesModule, ProductServiceSuppliersModule, InventoryMovementsModule],
})
export class InventoryFeatureModule {}
