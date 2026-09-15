import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { PettyCashSettlementsController } from './petty-cash-settlements.controller';
import { PettyCashSettlementsService } from './petty-cash-settlements.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [PettyCashSettlementsController],
  providers: [PettyCashSettlementsService],
  exports: [PettyCashSettlementsService],
})
export class PettyCashSettlementsModule {}
