import { Module } from '@nestjs/common';
import { CreditManagementModule } from './credit-management/credit-management.module';
import { CreditPaidModule } from './credit-paid/credit-paid.module';
import { CreditTypesModule } from './credit-types/credit-types.module';

@Module({
  imports: [CreditTypesModule, CreditManagementModule, CreditPaidModule],
})
export class CreditsFeaturesModule {}
