import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { ServicePricesController } from './services-prices.controller';
import { ServicePricesService } from './services-prices.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [ServicePricesController],
  providers: [ServicePricesService],
  exports: [ServicePricesService],
})
export class ServicePricesModule {}
