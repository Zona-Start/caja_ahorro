import { Module } from '@nestjs/common';
import { FixedAssetCategoriesController } from './fixed-assets-categories.controller';
import { FixedAssetCategoriesService } from './fixed-assets-categories.service';

@Module({
  controllers: [FixedAssetCategoriesController],
  providers: [FixedAssetCategoriesService],
})
export class FixedAssetsCategoriesModule {}
