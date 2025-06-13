import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../associate-accounts-movements/associate-accounts-movements.module';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';

@Module({
  imports: [DrizzleModule, AssociateAccountsMovementsModule],
  controllers: [AssociatesController],
  providers: [AssociatesService],
  exports: [AssociatesService],
})
export class AssociatesModule {}
