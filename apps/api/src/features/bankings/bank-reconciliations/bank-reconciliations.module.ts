import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { BankReconciliationsController } from './bank-reconciliations.controller';
import { BankReconciliationsService } from './bank-reconciliations.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [BankReconciliationsController],
  providers: [BankReconciliationsService],
  exports: [BankReconciliationsService],
})
export class BankReconciliationsModule {}
