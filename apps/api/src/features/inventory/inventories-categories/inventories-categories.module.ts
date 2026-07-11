import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { InventoriesCategoriesController } from './inventories-categories.controller';
import { InventoriesCategoriesService } from './inventories-categories.service';

@Module({
  imports: [DrizzleModule, TenantContextModule, AuditModule],
  controllers: [InventoriesCategoriesController],
  providers: [InventoriesCategoriesService],
  exports: [InventoriesCategoriesService],
})
export class InventoriesCategoriesModule {}
