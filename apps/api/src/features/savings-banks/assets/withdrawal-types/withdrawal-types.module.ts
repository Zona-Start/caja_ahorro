import { Module } from '@nestjs/common';
import { WithdrawalTypesService } from './withdrawal-types.service';
import { WithdrawalTypesController } from './withdrawal-types.controller';

@Module({
  controllers: [WithdrawalTypesController],
  providers: [WithdrawalTypesService],
})
export class WithdrawalTypesModule {}
