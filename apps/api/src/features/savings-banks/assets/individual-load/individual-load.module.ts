import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../associate-accounts-movements/associate-accounts-movements.module';
import { IndividualLoadController } from './individual-load.controller';
import { IndividualLoadService } from './individual-load.service';

@Module({
  imports: [AssociateAccountsMovementsModule, BankMovementsModule],
  controllers: [IndividualLoadController],
  providers: [IndividualLoadService],
})
export class IndividualLoadModule {}
