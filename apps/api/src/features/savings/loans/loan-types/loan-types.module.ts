import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { LoanTypesController } from './loan-types.controller';
import { LoanTypesService } from './loan-types.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [LoanTypesController],
  providers: [LoanTypesService],
  exports: [LoanTypesService],
})
export class LoanTypesModule {}
