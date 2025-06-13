import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { LoanManagementController } from './loan-management.controller';
import { LoanManagementService } from './loan-management.service';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
  ],
  controllers: [LoanManagementController],
  providers: [LoanManagementService],
})
export class LoanManagementModule {}
