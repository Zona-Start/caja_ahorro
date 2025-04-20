import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

@Module({
  imports: [SettingsSystemModule, DrizzleModule],
  controllers: [LoanController],
  providers: [LoanService],
})
export class LoanModule {}
