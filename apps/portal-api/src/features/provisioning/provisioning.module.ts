import { Module } from '@nestjs/common';
import { ProvisioningScheduler } from './provisioning.scheduler';
import { ProvisioningService } from './provisioning.service';

@Module({
  providers: [ProvisioningService, ProvisioningScheduler],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
