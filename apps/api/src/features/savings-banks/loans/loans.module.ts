import { Module } from '@nestjs/common';
import { LoanTypesModule } from './loan-types/loan-types.module';
import { LoanManagementModule } from './loan_management/loan-management.module';

@Module({
  imports: [LoanManagementModule, LoanTypesModule],
})
export class LoansFeaturesModule {}
