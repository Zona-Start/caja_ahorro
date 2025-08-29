import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { ProductPricesController } from './product-prices.controller';
import { ProductPricesService } from './product-prices.service';

@Module({
  imports: [DrizzleModule, SettingsSystemModule],
  controllers: [ProductPricesController],
  providers: [ProductPricesService],
  exports: [ProductPricesService],
})
export class ProductPricesModule {}
