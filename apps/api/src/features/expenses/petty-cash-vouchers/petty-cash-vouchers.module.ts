import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { PettyCashVouchersController } from './petty-cash-vouchers.controller';
import { PettyCashVouchersService } from './petty-cash-vouchers.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AccountingEntriesModule],
  controllers: [PettyCashVouchersController],
  providers: [PettyCashVouchersService],
  exports: [PettyCashVouchersService],
})
export class PettyCashVouchersModule {}
