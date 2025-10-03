import { AccountingCyclesModule } from '../../accounting/accounting-cycles/accounting-cycles.module';
import { AccountingEntriesModule } from '../../accounting/accounting-entries/accounting-entries.module';
import { SettingsSystemModule } from '../../core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';

@Module({
  imports: [AccountingEntriesModule, AccountingCyclesModule, SettingsSystemModule],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
})
export class BankAccountsModule {}
