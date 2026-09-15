import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CashRegistersController } from './cash-registers.controller';
import { CashRegistersService } from './cash-registers.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [CashRegistersController],
  providers: [CashRegistersService],
  exports: [CashRegistersService],
})
export class CashRegistersModule {}
