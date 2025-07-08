import { Module } from '@nestjs/common';
import { SalesProductCategoriesService } from './sales-product-categories.service';
import { SalesProductCategoriesController } from './sales-product-categories.controller';

@Module({
  controllers: [SalesProductCategoriesController],
  providers: [SalesProductCategoriesService],
})
export class SalesProductCategoriesModule {}
