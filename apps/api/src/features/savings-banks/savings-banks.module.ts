import { Module } from '@nestjs/common';
import { AssociateAccountsModule } from './associate-accounts/associate-accounts.module';
import { AssociatesModule } from './associates/associates.module';

@Module({
  imports: [AssociatesModule, AssociateAccountsModule],
})
export class SavingsBanksFeatureModule {}
