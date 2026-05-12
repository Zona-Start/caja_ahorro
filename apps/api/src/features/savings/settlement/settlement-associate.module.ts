import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { SavingsLiquidationService } from './liquidation.service';
import { SettlementAssociateController } from './settlement-associate.controller';
import { SettlementAssociateService } from './settlement-associate.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    TenantContextModule,
  ],
  controllers: [SettlementAssociateController],
  providers: [SettlementAssociateService, SavingsLiquidationService],
  exports: [SettlementAssociateService, SavingsLiquidationService],
})
export class SettlementAssociateModule {}
