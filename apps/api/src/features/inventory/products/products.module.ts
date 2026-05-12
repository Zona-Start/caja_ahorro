import { AuditModule } from '@/features/audit/audit.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { ProductPricesModule } from '../product-prices/product-prices.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    AuditModule,
    GenerateCodeModule,
    ProductPricesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
