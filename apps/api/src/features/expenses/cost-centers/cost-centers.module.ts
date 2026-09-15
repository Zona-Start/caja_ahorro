import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [CostCentersController],
  providers: [CostCentersService],
  exports: [CostCentersService],
})
export class CostCentersModule {}
