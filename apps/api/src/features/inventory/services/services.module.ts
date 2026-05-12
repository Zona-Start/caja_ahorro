import { AuditModule } from '@/features/audit/audit.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { ServicePricesModule } from '../services-prices/services-prices.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    AuditModule,
    GenerateCodeModule,
    ServicePricesModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
