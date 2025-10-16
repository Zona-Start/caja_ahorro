import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsController } from './associate-accounts-movements.controller';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';

@Module({
  imports: [GenerateCodeModule],
  controllers: [AssociateAccountsMovementsController],
  providers: [AssociateAccountsMovementsService],
  exports: [AssociateAccountsMovementsService],
})
export class AssociateAccountsMovementsModule {}
