import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ConfigureIntegrationDto,
  TenantIntegrationQueryDto,
} from './dto/tenant-integrations.dto';
import {
  TenantModuleQueryDto,
  ToggleModuleDto,
} from './dto/tenant-modules.dto';
import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantDto,
} from './dto/tenants.dto';
import { TenantsService } from './tenants.service';

@Controller('core/tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Get()
  @Permissions({ resource: 'tenants', action: 'read', scope: 'global' })
  async findAll(@Query() dto: TenantQueryDto) {
    return this.tenantsService.findAll(dto);
  }

  @Get('count')
  @Permissions({ resource: 'tenants', action: 'read', scope: 'global' })
  async getActiveCount() {
    return { count: await this.tenantsService.getActiveCount() };
  }

  @Get(':id')
  @Permissions({ resource: 'tenants', action: 'read', scope: 'tenant' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId, isSystemAdmin } =
      this.tenantService.getTenantContext(req, id);
    return this.tenantsService.findById(id, targetTenantId, isSystemAdmin);
  }

  @Get('rif/:rif')
  @Permissions({ resource: 'tenants', action: 'read', scope: 'global' })
  async findByRif(@Param('rif') rif: string) {
    return this.tenantsService.findByRif(rif);
  }

  @Post()
  @Permissions({ resource: 'tenants', action: 'create', scope: 'global' })
  async create(@Body() dto: CreateTenantDto, @Req() req: Request) {
    const { userId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantsService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions({ resource: 'tenants', action: 'update', scope: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, isSystemAdmin, userId } =
      this.tenantService.getTenantContext(req, id);
    return this.tenantsService.update(
      id,
      dto,
      isSystemAdmin,
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @Permissions({ resource: 'tenants', action: 'delete', scope: 'global' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  @Get(':id/modules')
  @Permissions({ resource: 'tenants', action: 'read', scope: 'global' })
  async listModules(
    @Param('id') id: string,
    @Query() query: TenantModuleQueryDto,
  ) {
    return this.tenantsService.listModules(id, query.status);
  }

  @Post(':id/modules')
  @Permissions({ resource: 'tenants', action: 'update', scope: 'global' })
  async toggleModule(
    @Param('id') id: string,
    @Body() dto: ToggleModuleDto,
    @Req() req: Request,
  ) {
    const { userId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantsService.toggleModule(id, dto, userId);
  }

  @Get(':id/integrations')
  @Permissions({ resource: 'tenants', action: 'read', scope: 'global' })
  async listIntegrations(
    @Param('id') id: string,
    @Query() query: TenantIntegrationQueryDto,
  ) {
    return this.tenantsService.listIntegrations(id, query.isEnabled);
  }

  @Post(':id/integrations')
  @Permissions({ resource: 'tenants', action: 'update', scope: 'global' })
  async configureIntegration(
    @Param('id') id: string,
    @Body() dto: ConfigureIntegrationDto,
  ) {
    return this.tenantsService.configureIntegration(id, dto);
  }
}
