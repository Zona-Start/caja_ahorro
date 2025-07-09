import { Module } from '@nestjs/common';
import { FixedAssetsMaintenancesService } from './fixed-assets-maintenances.service';
import { FixedAssetsMaintenancesController } from './fixed-assets-maintenances.controller';

@Module({
  controllers: [FixedAssetsMaintenancesController],
  providers: [FixedAssetsMaintenancesService],
})
export class FixedAssetsMaintenancesModule {}
