import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { LoanPaidModule } from '../../loans/loan_paid/loan-paid.module';
import { SettlementAssociateController } from './settlement-associate.controller';
import { SettlementAssociateService } from './settlement-associate.service';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
    LoanPaidModule,
  ],
  controllers: [SettlementAssociateController],
  providers: [SettlementAssociateService],
})
export class SettlementAssociateModule {}
