import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { PurchasingPdfModule } from '@/features/purchasing/pdf/purchasing-pdf.module';
import { PurchasingXlsxModule } from '@/features/purchasing/xlsx/purchasing-xlsx.module';
import { SupplierTransactionsController } from './supplier-transactions.controller';
import { SupplierTransactionsService } from './supplier-transactions.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, PurchasingPdfModule, PurchasingXlsxModule],
  controllers: [SupplierTransactionsController],
  providers: [SupplierTransactionsService],
  exports: [SupplierTransactionsService],
})
export class SupplierTransactionsModule {}
