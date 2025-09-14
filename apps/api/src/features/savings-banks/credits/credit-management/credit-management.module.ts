import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { InventoryMovementsModule } from '@/features/administration/inventory/inventory-movements/inventory-movements.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { CreditManagementController } from './credit-management.controller';
import { CreditManagementService } from './credit-management.service';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    InventoryMovementsModule,
  ],
  controllers: [CreditManagementController],
  providers: [CreditManagementService],
})
export class CreditManagementModule {}
