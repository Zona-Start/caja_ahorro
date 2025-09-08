import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { forwardRef, Module } from '@nestjs/common';
import { SupplierInvoicesModule } from '../supplier-invoices/supplier-invoices.module';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';

@Module({
  imports: [
    DrizzleModule,
    GenerateCodeModule,
    forwardRef(() => SupplierInvoicesModule),
  ],
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService],
  exports: [AccountsPayableService],
})
export class AccountsPayableModule {}
