import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsSystemModule } from '@/features/core/settings-system/settings-system.module';
import { Module } from '@nestjs/common';
import { CrediPaidController } from './credit-paid.controller';
import { CreditPaidService } from './credit-paid.service';

@Module({
  imports: [SettingsSystemModule, DrizzleModule],
  controllers: [CrediPaidController],
  providers: [CreditPaidService],
})
export class CreditPaidModule {}
