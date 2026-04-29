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
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  @Permissions({ resource: 'tenants', action: 'update', scope: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, isSystemAdmin } =
      this.tenantService.getTenantContext(req, id);
    return this.tenantsService.update(id, dto, isSystemAdmin, targetTenantId);
  }

  @Delete(':id')
  @Permissions({ resource: 'tenants', action: 'delete', scope: 'global' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
