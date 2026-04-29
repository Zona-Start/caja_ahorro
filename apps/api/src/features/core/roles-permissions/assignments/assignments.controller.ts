import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AssignmentsService } from './assignments.service';
import { AssignPermissionsDto } from './dtos/assign-permissions.dto';

@Controller('core/roles-permissions/assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Get('role/:roleId')
  @Permissions({ resource: 'iam:roles', action: 'read', scope: 'tenant' })
  async getRolePermissions(
    @Param('roleId') roleId: string,
    @Req() req: Request,
    @Query() tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    return this.assignmentsService.getRolePermissions(roleId, targetTenantId);
  }

  @Post('role/:roleId')
  @Permissions({ resource: 'iam:roles', action: 'update', scope: 'tenant' })
  async assignPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionsDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );

    const parsedPermissions = dto.permissions.map((p: any) => {
      if (typeof p === 'string') {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(p)) return { id: p };
        const [resource, action, scope] = p.split(':');
        return { resource, action, scope };
      }
      return p;
    });

    return this.assignmentsService.assignPermissions(
      roleId,
      userId,
      parsedPermissions,
      targetTenantId,
    );
  }

  @Delete('role/:roleId')
  @Permissions({ resource: 'iam:roles', action: 'update', scope: 'tenant' })
  async removePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionsDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );

    const parsedPermissions = dto.permissions.map((p: any) => {
      if (typeof p === 'string') {
        const [resource, action, scope] = p.split(':');
        return { resource, action, scope };
      }
      return p;
    });

    return this.assignmentsService.removePermissions(
      roleId,
      userId,
      parsedPermissions,
      targetTenantId,
    );
  }
}
