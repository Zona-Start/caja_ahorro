import { Module } from '@nestjs/common';
import { SalesProductsService } from './sales-products.service';
import { SalesProductsController } from './sales-products.controller';

@Module({
  controllers: [SalesProductsController],
  providers: [SalesProductsService],
})
export class SalesProductsModule {}
