import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';

@Module({
  imports: [BankModule],
})
export class BanksModule {}
