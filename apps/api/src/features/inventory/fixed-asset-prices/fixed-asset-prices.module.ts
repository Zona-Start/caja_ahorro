import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { FixedAssetPricesController } from './fixed-asset-prices.controller';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [FixedAssetPricesController],
  providers: [FixedAssetPricesService],
  exports: [FixedAssetPricesService],
})
export class FixedAssetPricesModule {}
