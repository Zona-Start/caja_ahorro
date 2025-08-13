import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { FixedAssetPricesController } from './fixed-asset-prices.controller';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@Module({
  imports: [DrizzleModule],
  controllers: [FixedAssetPricesController],
  providers: [FixedAssetPricesService],
  exports: [FixedAssetPricesService],
})
export class FixedAssetPricesModule {}
