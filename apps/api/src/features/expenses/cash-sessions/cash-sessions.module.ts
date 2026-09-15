import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CashSessionsController } from './cash-sessions.controller';
import { CashSessionsService } from './cash-sessions.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [CashSessionsController],
  providers: [CashSessionsService],
  exports: [CashSessionsService],
})
export class CashSessionsModule {}
