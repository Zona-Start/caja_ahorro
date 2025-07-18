import { Module } from '@nestjs/common';

import { InventoryFeatureModule } from './inventory/inventory-module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule, InventoryFeatureModule],
})
export class AdministrationFeaturesModule {}
