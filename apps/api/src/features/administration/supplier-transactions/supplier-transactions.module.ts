import { Module } from '@nestjs/common';
import { SupplierTransactionsController } from './supplier-transactions.controller';
import { SupplierTransactionsService } from './supplier-transactions.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [SupplierTransactionsController],
  providers: [SupplierTransactionsService],
})
export class SupplierTransactionsModule {}
