import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { PettyCashController } from './petty-cash.controller';
import { PettyCashService } from './petty-cash.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [PettyCashController],
  providers: [PettyCashService],
  exports: [PettyCashService],
})
export class PettyCashModule {}
