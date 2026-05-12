import { Module } from '@nestjs/common';
import { LoanTypesModule } from './loan-types/loan-types.module';
import { LoanManagementModule } from './loan_management/loan-management.module';
import { LoanPaidModule } from './loan_paid/loan-paid.module';

@Module({
  imports: [LoanTypesModule, LoanManagementModule, LoanPaidModule],
})
export class LoansFeaturesModule {}
