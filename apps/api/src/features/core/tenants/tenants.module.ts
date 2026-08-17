import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantIntegrationService } from './services/tenant-integrations.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { TenantResolutionService } from './services/tenant-resolution.service';
import { TenantPublicController } from './tenant-public.controller';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [ConfigModule, DrizzleModule, TenantContextModule, AuditModule],
  controllers: [TenantsController, TenantPublicController],
  providers: [
    TenantsService,
    TenantProvisioningService,
    TenantIntegrationService,
    TenantResolutionService,
  ],
  exports: [
    TenantsService,
    TenantProvisioningService,
    TenantIntegrationService,
    TenantResolutionService,
  ],
})
export class TenantsModule {}
