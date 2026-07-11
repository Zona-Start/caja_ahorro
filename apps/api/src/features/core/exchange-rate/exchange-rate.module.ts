import { DrizzleModule } from '@/database/drizzle.module';
import { SettingsModule } from '@/features/core/settings/settings.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BcvScraperService } from './bcv-scraper.service';
import { BcvService } from './bcv.service';
import { ExchangeRatesController } from './exchange-rate.controller';

@Module({
  imports: [DrizzleModule, ScheduleModule.forRoot(), SettingsModule],
  controllers: [ExchangeRatesController],
  providers: [BcvService, BcvScraperService],
  exports: [BcvService, BcvScraperService],
})
export class ExchangeRateModule {}
