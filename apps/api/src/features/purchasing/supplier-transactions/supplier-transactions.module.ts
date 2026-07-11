import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { SupplierTransactionsController } from './supplier-transactions.controller';
import { SupplierTransactionsService } from './supplier-transactions.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [SupplierTransactionsController],
  providers: [SupplierTransactionsService],
  exports: [SupplierTransactionsService],
})
export class SupplierTransactionsModule {}
