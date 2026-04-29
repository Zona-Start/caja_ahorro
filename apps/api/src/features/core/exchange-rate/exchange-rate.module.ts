import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcvService } from './bcv.service';

@Module({
  imports: [ConfigModule, DrizzleModule],
  providers: [BcvService],
  exports: [BcvService],
})
export class ExchangeRateModule {}
