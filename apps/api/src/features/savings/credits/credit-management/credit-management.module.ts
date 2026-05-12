import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { InventoryMovementsModule } from '@/features/inventory/inventory-movements/inventory-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { CreditManagementController } from './credit-management.controller';
import { CreditManagementService } from './credit-management.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    InventoryMovementsModule,
    TenantContextModule,
    AuditModule,
  ],
  controllers: [CreditManagementController],
  providers: [CreditManagementService],
})
export class CreditManagementModule {}
