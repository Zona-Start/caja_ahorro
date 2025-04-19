import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsController } from './associate-accounts.controller';
import { AssociateAccountsService } from './associate-accounts.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AssociateAccountsController],
  providers: [AssociateAccountsService],
  exports: [AssociateAccountsService],
})
export class AssociateAccountsModule {}
