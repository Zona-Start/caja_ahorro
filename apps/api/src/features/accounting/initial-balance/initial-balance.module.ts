
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountPlanModule } from '../account-plan/account-plan.module';
import { InitialBalanceController } from './initial-balance.controller';
import { InitialBalanceService } from './initial-balance.service';

@Module({
  imports: [DrizzleModule, AccountPlanModule],
  controllers: [InitialBalanceController],
  providers: [InitialBalanceService],
})
export class InitialBalanceModule {}
