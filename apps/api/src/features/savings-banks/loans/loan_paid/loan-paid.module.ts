import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { LoanPaidController } from './loan-paid.controller';
import { LoanPaidService } from './loan-paid.service';

@Module({
  imports: [SettingsSystemModule, DrizzleModule],
  controllers: [LoanPaidController],
  providers: [LoanPaidService],
})
export class LoanPaidModule {}
