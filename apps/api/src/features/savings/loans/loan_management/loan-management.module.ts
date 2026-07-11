import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { LoanManagementController } from './loan-management.controller';
import { LoanManagementService } from './loan-management.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    TenantContextModule,
    AuditModule,
    BankMovementsModule,
  ],
  controllers: [LoanManagementController],
  providers: [LoanManagementService],
  exports: [LoanManagementService],
})
export class LoanManagementModule {}
