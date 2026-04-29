import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { TenantContextService } from './tenant-context.service';

@Module({
  imports: [ClsModule],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantContextModule {}
