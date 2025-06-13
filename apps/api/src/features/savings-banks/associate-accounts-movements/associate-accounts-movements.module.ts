import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsController } from './associate-accounts-movements.controller';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';

@Module({
  controllers: [AssociateAccountsMovementsController],
  providers: [AssociateAccountsMovementsService],
  exports: [AssociateAccountsMovementsService],
})
export class AssociateAccountsMovementsModule {}
