import { DrizzleModule } from '@/database/drizzle.module';
import { AuditLogsModule } from '@/features/audit/audit-logs/audit-logs.module';
import { AssociateAccountsMovementsModule } from '@/features/savings-banks/associate-accounts-movements/associate-accounts-movements.module';
import { Module } from '@nestjs/common';
import { BankMovementsController } from './bank-movements.controller';
import { BankMovementsService } from './bank-movements.service';

@Module({
  imports: [DrizzleModule, AuditLogsModule, AssociateAccountsMovementsModule],
  controllers: [BankMovementsController],
  providers: [BankMovementsService],
  exports: [BankMovementsService],
})
export class BankMovementsModule {}
