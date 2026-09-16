import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { InventoryMovementsModule } from '@/features/inventory/inventory-movements/inventory-movements.module';
import { Module } from '@nestjs/common';
import { DeliveryNotesModule } from '../delivery-notes/delivery-notes.module';
import { CustomerPaymentsModule } from '../payments/customer-payments.module';
import { SalesInvoicesController } from './sales-invoices.controller';
import { SalesInvoicesService } from './sales-invoices.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    GenerateCodeModule,
    InventoryMovementsModule,
    CustomerPaymentsModule,
    DeliveryNotesModule,
    AccountingEntriesModule,
  ],
  controllers: [SalesInvoicesController],
  providers: [SalesInvoicesService],
  exports: [SalesInvoicesService],
})
export class SalesInvoicesModule {}
