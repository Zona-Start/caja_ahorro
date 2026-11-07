import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { SettlementAssociateModule } from '../settlement/settlement-associate.module';
import { SpecialOperationsAccountingService } from './special-operations-accounting.service';
import { SpecialOperationsController } from './special-operations.controller';
import { SpecialOperationsExecutionService } from './special-operations-execution.service';
import { SpecialOperationsPreviewService } from './special-operations-preview.service';
import { SpecialOperationsService } from './special-operations.service';
import { SpecialOperationsTemplateService } from './special-operations-template.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    AssociateAccountsMovementsModule,
    SettlementAssociateModule,
  ],
  controllers: [SpecialOperationsController],
  providers: [
    SpecialOperationsService,
    SpecialOperationsPreviewService,
    SpecialOperationsExecutionService,
    SpecialOperationsAccountingService,
    SpecialOperationsTemplateService,
  ],
  exports: [SpecialOperationsService],
})
export class SpecialOperationsModule {}
