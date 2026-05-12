import { AuditModule } from '@/features/audit/audit.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { FixedAssetPricesModule } from '../fixed-asset-prices/fixed-asset-prices.module';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAssetsService } from './fixed-assets.service';

@Module({
  imports: [
    FixedAssetPricesModule,
    DrizzleModule,
    GenerateCodeModule,
    TenantContextModule,
    AuditModule,
  ],
  controllers: [FixedAssetsController],
  providers: [FixedAssetsService],
  exports: [FixedAssetsService],
})
export class FixedAssetsModule {}
