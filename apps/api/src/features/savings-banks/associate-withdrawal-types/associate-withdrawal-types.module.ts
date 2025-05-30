import { Module } from '@nestjs/common';
import { AssociateWithdrawalTypesService } from './associate-withdrawal-types.service';
import { AssociateWithdrawalTypesController } from './associate-withdrawal-types.controller';

@Module({
  controllers: [AssociateWithdrawalTypesController],
  providers: [AssociateWithdrawalTypesService],
})
export class AssociateWithdrawalTypesModule {}
