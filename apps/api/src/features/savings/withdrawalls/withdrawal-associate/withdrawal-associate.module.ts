import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { InventoryMovementsModule } from '@/features/inventory/inventory-movements/inventory-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { WithdrawalAssociateController } from './withdrawal-associate.controller';
import { WithdrawalAssociateService } from './withdrawal-associate.service';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    InventoryMovementsModule,
    AccountingEntriesModule,
    BankMovementsModule,
    TenantContextModule,
  ],
  controllers: [WithdrawalAssociateController],
  providers: [WithdrawalAssociateService],
  exports: [WithdrawalAssociateService],
})
export class WithdrawalAssociateModule {}
