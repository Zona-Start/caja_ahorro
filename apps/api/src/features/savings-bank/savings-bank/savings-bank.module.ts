import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { SavingsBankController } from './savings-bank.controller';
import { SavingsBankService } from './savings-bank.service';

@Module({
  imports: [DrizzleModule],
  controllers: [SavingsBankController],
  providers: [SavingsBankService],
  exports: [SavingsBankService],
})
export class SavingsBankModule {}
