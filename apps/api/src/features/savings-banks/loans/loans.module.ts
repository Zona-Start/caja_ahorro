import { Module } from '@nestjs/common';
import { LoanTypesModule } from './loan-types/loan-types.module';
import { LoanModule } from './loan/loan.module';

@Module({
  imports: [LoanTypesModule, LoanModule]
})
export class LoansFeaturesModule {}
