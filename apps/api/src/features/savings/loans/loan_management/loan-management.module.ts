import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { LoanManagementController } from './loan-management.controller';
import { LoanManagementService } from './loan-management.service';
import { TenantContextModule } from '@/common/services/tenant-context.module';

@Module({
  imports: [
    DrizzleModule,
    GenerateCodeModule,
    TenantContextModule,
  ],
  controllers: [LoanManagementController],
  providers: [LoanManagementService],
})
export class LoanManagementModule {}
