import { Module } from '@nestjs/common';
import { ProductServiceSuppliersController } from './product-service-suppliers.controller';
import { ProductServiceSuppliersService } from './product-service-suppliers.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ProductServiceSuppliersController],
  providers: [ProductServiceSuppliersService],
})
export class ProductServiceSuppliersModule {}
