import { Module } from '@nestjs/common';
import { BankDirectoryModule } from './bank-directory/bank-directory.module';

@Module({
  imports: [BankDirectoryModule],
})
export class BankingsModule {}
