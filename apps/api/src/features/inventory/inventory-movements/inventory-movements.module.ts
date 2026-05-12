import { AuditModule } from '@/features/audit/audit.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';

@Module({
  imports: [DrizzleModule, GenerateCodeModule, TenantContextModule, AuditModule],
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService],
  exports: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
