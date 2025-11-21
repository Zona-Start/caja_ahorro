import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountPlanModule } from '../account-plan/account-plan.module';
import { AccountingBalanceController } from './accounting-balance.controller';
import { AccountingBalanceService } from './accounting-balance.service';

@Module({
  imports: [DrizzleModule, AccountPlanModule],
  controllers: [AccountingBalanceController],
  providers: [AccountingBalanceService],
})
export class AccountingBalanceModule {}
