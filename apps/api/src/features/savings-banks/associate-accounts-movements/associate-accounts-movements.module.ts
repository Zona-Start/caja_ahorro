import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import { AssociateAccountsMovementsController } from './associate-accounts-movements.controller';

@Module({
  controllers: [AssociateAccountsMovementsController],
  providers: [AssociateAccountsMovementsService],
})
export class AssociateAccountsMovementsModule {}
