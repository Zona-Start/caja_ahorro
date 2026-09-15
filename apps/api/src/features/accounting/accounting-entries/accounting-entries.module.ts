import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { ExchangeRateModule } from '@/features/core/exchange-rate/exchange-rate.module';
import { Module } from '@nestjs/common';
import { AccountPlanService } from '../account-plan/account-plan.service';
import { AccountingCyclesService } from '../accounting-cycles/accounting-cycles.service';
import { DiferencialCambiarioService } from '../diferencial-cambiario/diferencial-cambiario.service';
import { AccountingEntriesController } from './accounting-entries.controller';
import { AccountingEntriesService } from './accounting-entries.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    AuditModule,
    ExchangeRateModule,
  ],
  controllers: [AccountingEntriesController],
  providers: [
    AccountingEntriesService,
    AccountingCyclesService,
    AccountPlanService,
    DiferencialCambiarioService,
  ],
  exports: [AccountingEntriesService],
})
export class AccountingEntriesModule {}
