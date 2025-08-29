import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ProductPricesModule } from '../product-prices/product-prices.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [GenerateCodeModule, DrizzleModule, ProductPricesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
