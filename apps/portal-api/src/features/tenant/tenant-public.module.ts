import { Module } from '@nestjs/common';
import { TenantPublicController } from './tenant-public.controller';
import { TenantResolveService } from './tenant-resolve.service';

@Module({
  controllers: [TenantPublicController],
  providers: [TenantResolveService],
  exports: [TenantResolveService],
})
export class TenantPublicModule {}
