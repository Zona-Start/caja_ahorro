import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountPlanController } from './account-plan.controller';
import { AccountPlanService } from './account-plan.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AccountPlanController],
  providers: [AccountPlanService],
  exports: [AccountPlanService],
})
export class AccountPlanModule {}
