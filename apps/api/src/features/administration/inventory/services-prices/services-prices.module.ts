import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ServicePricesController } from './services-prices.controller';
import { ServicePricesService } from './services-prices.service';

@Module({
  imports: [DrizzleModule],
  controllers: [ServicePricesController],
  providers: [ServicePricesService],
  exports: [ServicePricesService],
})
export class ServicePricesModule {}
