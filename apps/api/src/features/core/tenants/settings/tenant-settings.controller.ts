import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UpdateTenantSettingDto } from './dto/tenant-settings.dto';
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
  async findAll(@Req() req: Request, @Query() tenantId?: string) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    return this.tenantSettingsService.findAllByTenant(targetTenantId);
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
    @Query() tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    return this.tenantSettingsService.findByTenantAndCategory(
      targetTenantId,
      category,
    );
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
    @Query() tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );
    const setting = await this.tenantSettingsService.findById(
      id,
      targetTenantId,
    );
    return setting;
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
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    return this.tenantSettingsService.update(id, dto, targetTenantId, userId);
  }
}
