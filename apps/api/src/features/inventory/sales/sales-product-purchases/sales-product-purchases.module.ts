import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { SalesProductPurchasesController } from './sales-product-purchases.controller';
import { SalesProductPurchasesService } from './sales-product-purchases.service';

@Module({
  imports: [DrizzleModule],
  controllers: [SalesProductPurchasesController],
  providers: [SalesProductPurchasesService],
  exports: [SalesProductPurchasesService],
})
export class SalesProductPurchasesModule {}
