import { AuditModule } from '@/features/audit/audit.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { CreditTypesController } from './credit-types.controller';
import { CreditTypesService } from './credit-types.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [CreditTypesController],
  providers: [CreditTypesService],
  exports: [CreditTypesService],
})
export class CreditTypesModule {}
