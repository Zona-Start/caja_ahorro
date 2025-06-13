import { DrizzleModule } from '@/database/drizzle.module';
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
  ],
  controllers: [CreditManagementController],
  providers: [CreditManagementService],
})
export class CreditManagementModule {}
