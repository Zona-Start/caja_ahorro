import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateTenantSettingDto,
  TenantSettingQueryDto,
  UpdateTenantSettingDto,
} from './dto/tenant-settings.dto';
import { TenantSettingsService } from './tenant-settings.service';

@Controller('core/tenants-settings')
export class TenantSettingsController {
  constructor(
    private readonly tenantSettingsService: TenantSettingsService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Get()
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'read',
    scope: 'tenant',
  })
  async findAll(@Req() req: Request, @Query() dto: TenantSettingQueryDto) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantSettingsService.findAll(targetTenantId, dto);
  }

  @Get('category/:category')
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'read',
    scope: 'tenant',
  })
  async findByCategory(
    @Param('category') category: string,
    @Req() req: Request,
    @Query() dto: TenantSettingQueryDto,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantSettingsService.findByTenantAndCategory(
      targetTenantId,
      category,
    );
  }

  @Get('key/:key')
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'read',
    scope: 'tenant',
  })
  async findByModule(
    @Param('key') key: string,
    @Req() req: Request,
    @Query() dto: TenantSettingQueryDto,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantSettingsService.findByTenantAndKey(targetTenantId, key);
  }

  @Get(':id')
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'read',
    scope: 'tenant',
  })
  async findById(
    @Param('id') id: string,
    @Req() req: Request,
    @Query() dto: TenantSettingQueryDto,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.tenantSettingsService.findById(id, targetTenantId);
  }

  @Post()
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'create',
    scope: 'tenant',
  })
  async create(
    @Body() dto: CreateTenantSettingDto,
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      tenantId ? { tenantId } : dto,
    );
    return this.tenantSettingsService.create(targetTenantId, dto, userId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'system:tenants-systems',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantSettingDto,
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      tenantId ? { tenantId } : dto,
    );
    return this.tenantSettingsService.update(id, dto, targetTenantId, userId);
  }
}
