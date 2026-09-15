import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CashMovementsController } from './cash-movements.controller';
import { CashMovementsService } from './cash-movements.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [CashMovementsController],
  providers: [CashMovementsService],
  exports: [CashMovementsService],
})
export class CashMovementsModule {}
