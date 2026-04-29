import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssignmentsController } from './assignments/assignments.controller';
import { AssignmentsService } from './assignments/assignments.service';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';

@Module({
  imports: [ConfigModule, AuditModule, DrizzleModule, TenantContextModule],
  controllers: [RolesController, PermissionsController, AssignmentsController],
  providers: [RolesService, PermissionsService, AssignmentsService],
  exports: [RolesService, PermissionsService, AssignmentsService],
})
export class RolesPermissionsModule {}
