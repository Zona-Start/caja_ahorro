import { Module } from '@nestjs/common';
import { CustomersModule } from './customers/customers.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { SalesInvoicesModule } from './invoices/sales-invoices.module';
import { CustomerPaymentsModule } from './payments/customer-payments.module';

@Module({
  imports: [
    CustomersModule,
    SalesInvoicesModule,
    DeliveryNotesModule,
    CustomerPaymentsModule,
  ],
})
export class SalesFeatureModule {}
