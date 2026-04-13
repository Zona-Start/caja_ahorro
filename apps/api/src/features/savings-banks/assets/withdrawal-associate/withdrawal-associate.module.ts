import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { InventoryMovementsModule } from '@/features/administration/inventory/inventory-movements/inventory-movements.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { WithdrawalAssociateController } from './withdrawal-associate.controller';
import { WithdrawalAssociateService } from './withdrawal-associate.service';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';

@Module({
  imports: [
    SettingsSystemModule,
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    InventoryMovementsModule,
    AccountingEntriesModule,
    BankMovementsModule
  ],
  controllers: [WithdrawalAssociateController],
  providers: [WithdrawalAssociateService],
  exports: [WithdrawalAssociateService],
})
export class WithdrawalAssociateModule {}
