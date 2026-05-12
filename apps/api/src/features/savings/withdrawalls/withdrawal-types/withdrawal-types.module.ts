import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { WithdrawalTypesService } from './withdrawal-types.service';
import { WithdrawalTypesController } from './withdrawal-types.controller';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [WithdrawalTypesController],
  providers: [WithdrawalTypesService],
  exports: [WithdrawalTypesService],
})
export class WithdrawalTypesModule {}
