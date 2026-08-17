import { TenantContextModule } from '@/common/services/tenant-context.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { R2Service } from './r2.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [ConfigModule, TenantContextModule],
  controllers: [StorageController],
  providers: [R2Service],
  exports: [R2Service],
})
export class StorageModule {}
