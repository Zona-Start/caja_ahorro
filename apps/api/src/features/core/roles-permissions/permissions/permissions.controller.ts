import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('core/roles-permissions/permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'iam:permissions',
    action: 'create',
    scope: 'global',
  })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
    @Req() req: Request,
  ) {
    const userId = this.tenantService.getUserId(req);
    return this.permissionsService.create(createPermissionDto, userId);
  }

  @Get()
  @Permissions({ resource: 'iam:permissions', action: 'read', scope: 'global' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Permissions({ resource: 'iam:permissions', action: 'read', scope: 'global' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'iam:permissions',
    action: 'delete',
    scope: 'global',
  })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
