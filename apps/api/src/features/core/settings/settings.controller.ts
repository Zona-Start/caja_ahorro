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
  CreateGlobalSettingDto,
  CreateModuleSettingDto,
  SettingsQueryDto,
  UpdateGlobalSettingDto,
  UpdateModuleSettingDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@Controller('core/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly tenantService: TenantContextService,
  ) {}

  // ==========================================
  // CONFIGURACIÓN GLOBAL (Solo Superadmin)
  // ==========================================

  @Get('global')
  @Permissions({ resource: 'settings', action: 'read', scope: 'global' })
  async findAllGlobal(@Query() dto: SettingsQueryDto) {
    return this.settingsService.findAllGlobal(dto);
  }

  @Get('global/:key')
  @Permissions({ resource: 'settings', action: 'read', scope: 'global' })
  async getGlobal(@Param('key') key: string) {
    return this.settingsService.getGlobal(key);
  }

  @Post('global')
  @Permissions({ resource: 'settings', action: 'create', scope: 'global' })
  async createGlobal(@Body() dto: CreateGlobalSettingDto) {
    return this.settingsService.createGlobal(dto);
  }

  @Patch('global/:id')
  @Permissions({ resource: 'settings', action: 'update', scope: 'global' })
  async updateGlobal(
    @Param('id') id: string,
    @Body() dto: UpdateGlobalSettingDto,
  ) {
    return this.settingsService.updateGlobal(id, dto);
  }

  @Delete('global/:id')
  @Permissions({ resource: 'settings', action: 'delete', scope: 'global' })
  async removeGlobal(@Param('id') id: string) {
    return this.settingsService.removeGlobal(id);
  }

  // ==========================================
  // CONFIGURACIÓN POR MÓDULO (Admin/Superadmin)
  // ==========================================

  @Get('module')
  @Permissions({
    resource: 'system:modules',
    action: 'read',
    scope: 'tenant',
  })
  async findAllModule(@Query() dto: SettingsQueryDto, @Req() req: Request) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    // Si no es superadmin, forzamos su tenantId
    return this.settingsService.findAllModule(dto, targetTenantId);
  }

  @Get('module/:module/:key')
  @Permissions({
    resource: 'system:modules',
    action: 'read',
    scope: 'tenant',
  })
  async getModule(
    @Param('module') module: string,
    @Param('key') key: string,
    @Query('submodule') submodule?: string,
  ) {
    const targetTenantId = this.tenantService.getTenantId();
    return this.settingsService.getModule(
      targetTenantId,
      module,
      key,
      submodule,
    );
  }

  @Post('module')
  @Permissions({
    resource: 'system:modules',
    action: 'create',
    scope: 'global',
  })
  async createModule(@Body() dto: CreateModuleSettingDto) {
    return this.settingsService.createModule(dto);
  }

  @Patch('module/:id')
  @Permissions({
    resource: 'system:modules',
    action: 'update',
    scope: 'tenant',
  })
  async updateModule(
    @Param('id') id: string,
    @Body() dto: UpdateModuleSettingDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    // Si no es superadmin, validamos que el registro pertenezca a su tenant
    return this.settingsService.updateModule(id, dto, targetTenantId, userId);
  }

  @Delete('module/:id')
  @Permissions({
    resource: 'system:modules',
    action: 'delete',
    scope: 'global',
  })
  async removeModule(@Param('id') id: string) {
    return this.settingsService.removeModule(id);
  }
}
