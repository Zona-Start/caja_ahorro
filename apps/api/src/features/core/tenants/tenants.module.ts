import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantIntegrationService } from './services/tenant-integrations.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [ConfigModule, DrizzleModule, TenantContextModule, AuditModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantProvisioningService,
    TenantIntegrationService,
  ],
  exports: [
    TenantsService,
    TenantProvisioningService,
    TenantIntegrationService,
  ],
})
export class TenantsModule {}
