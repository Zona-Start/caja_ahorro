import { Module } from '@nestjs/common';
import { BankDirectoryController } from './bank-directory.controller';
import { BankDirectoryService } from './bank-directory.services';

@Module({
  controllers: [BankDirectoryController],
  providers: [BankDirectoryService],
  exports: [BankDirectoryService],
})
export class BankDirectoryModule {}
