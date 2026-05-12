import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { InventoriesCategoriesService } from './inventories-categories.service';
import { InventoriesCategoriesController } from './inventories-categories.controller';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [InventoriesCategoriesController],
  providers: [InventoriesCategoriesService],
  exports: [InventoriesCategoriesService],
})
export class InventoriesCategoriesModule {}
