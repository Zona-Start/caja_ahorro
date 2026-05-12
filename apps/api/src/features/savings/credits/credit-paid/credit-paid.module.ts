import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { CrediPaidController } from './credit-paid.controller';
import { CreditPaidService } from './credit-paid.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    TenantContextModule,
    AuditModule,
  ],
  controllers: [CrediPaidController],
  providers: [CreditPaidService],
  exports: [CreditPaidService],
})
export class CreditPaidModule {}
