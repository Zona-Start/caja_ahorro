import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { FixedAssetPricesController } from './fixed-asset-prices.controller';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@Module({
  imports: [DrizzleModule, SettingsSystemModule],
  controllers: [FixedAssetPricesController],
  providers: [FixedAssetPricesService],
  exports: [FixedAssetPricesService],
})
export class FixedAssetPricesModule {}
