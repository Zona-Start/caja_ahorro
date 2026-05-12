import { Module } from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { BankReconciliationsController } from './bank-reconciliations.controller';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [BankReconciliationsController],
  providers: [BankReconciliationsService],
  exports: [BankReconciliationsService],
})
export class BankReconciliationsModule {}
