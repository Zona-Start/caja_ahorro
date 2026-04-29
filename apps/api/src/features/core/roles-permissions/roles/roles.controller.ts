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
  Patch,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleQueryDto } from './dtos/roles-query.dto';
import { RolesService } from './roles.service';

@Controller('core/roles-permissions/roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Get()
  @Permissions({ resource: 'iam:roles', action: 'read', scope: 'tenant' })
  async findAll(@Query() dto: RoleQueryDto, @Req() req: Request) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.rolesService.findAll(dto, targetTenantId);
  }

  @Get(':id')
  @Permissions({ resource: 'iam:roles', action: 'read', scope: 'tenant' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    return this.rolesService.findById(id, targetTenantId);
  }

  @Post()
  @Permissions({ resource: 'iam:roles', action: 'create', scope: 'tenant' })
  async create(@Body() dto: CreateRoleDto, @Req() req: Request) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    return this.rolesService.create(dto, targetTenantId, userId);
  }

  @Patch(':id')
  @Permissions({ resource: 'iam:roles', action: 'update', scope: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoleDto>,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    return this.rolesService.update(id, dto, targetTenantId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({ resource: 'iam:roles', action: 'delete', scope: 'tenant' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    await this.rolesService.remove(id, targetTenantId, userId);
  }
}
