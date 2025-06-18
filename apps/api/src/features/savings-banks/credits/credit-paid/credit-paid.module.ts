import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { CrediPaidController } from './credit-paid.controller';
import { CreditPaidService } from './credit-paid.service';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
  ],
  controllers: [CrediPaidController],
  providers: [CreditPaidService],
  exports: [CreditPaidService],
})
export class CreditPaidModule {}
