import { Module } from '@nestjs/common';
import { SupplierInvoicesController } from './supplier-invoices.controller';
import { SupplierInvoicesService } from './supplier-invoices.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [SupplierInvoicesController],
  providers: [SupplierInvoicesService],
})
export class SupplierInvoicesModule {}
