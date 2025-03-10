import { Module } from '@nestjs/common';
import { BankController } from './bank.controller';
import { BankService } from './bank.services';

@Module({
  controllers: [BankController],
  providers: [BankService],
  exports: [BankService],
})
export class BankModule {}
