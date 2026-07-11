import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { ProductServiceSuppliersController } from './product-service-suppliers.controller';
import { ProductServiceSuppliersService } from './product-service-suppliers.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [ProductServiceSuppliersController],
  providers: [ProductServiceSuppliersService],
  exports: [ProductServiceSuppliersService],
})
export class ProductServiceSuppliersModule {}
