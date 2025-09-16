import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { LoanPaidController } from './loan-paid.controller';
import { LoanPaidService } from './loan-paid.service';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
  ],
  controllers: [LoanPaidController],
  providers: [LoanPaidService],
  exports: [LoanPaidService],
})
export class LoanPaidModule {}
