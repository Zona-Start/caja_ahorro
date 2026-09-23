import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { SavingsLiquidationService } from './liquidation.service';
import { SettlementAssociateAccountingService } from './settlement-associate-accounting.service';
import { SettlementAssociateController } from './settlement-associate.controller';
import { SettlementAssociateService } from './settlement-associate.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    TenantContextModule,
    AccountingEntriesModule,
  ],
  controllers: [SettlementAssociateController],
  providers: [
    SettlementAssociateService,
    SavingsLiquidationService,
    SettlementAssociateAccountingService,
  ],
  exports: [SettlementAssociateService, SavingsLiquidationService],
})
export class SettlementAssociateModule {}
