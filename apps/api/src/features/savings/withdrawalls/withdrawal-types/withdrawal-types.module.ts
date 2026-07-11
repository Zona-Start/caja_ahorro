import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { WithdrawalTypesController } from './withdrawal-types.controller';
import { WithdrawalTypesService } from './withdrawal-types.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [WithdrawalTypesController],
  providers: [WithdrawalTypesService],
  exports: [WithdrawalTypesService],
})
export class WithdrawalTypesModule {}
