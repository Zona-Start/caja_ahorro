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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateFixedAssetDto,
  UpdateFixedAssetDto,
} from './dto/fixed-assets.schema';
import { FixedAssetPaginationDto } from './dto/pagination-fixed-asset.dto';
import { FixedAssetsService } from './fixed-assets.service';

@Controller('inventory/fixed-assets')
export class FixedAssetsController {
  constructor(
    private readonly fixedAssetsService: FixedAssetsService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post()
  @Permissions({
    resource: 'inventory:assets',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateFixedAssetDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const result = await this.fixedAssetsService.create(
      dto as Parameters<typeof this.fixedAssetsService.create>[0],
      targetTenantId,
      userId,
    );
    return {
      message: 'Activo fijo creado exitosamente',
      data: result,
    };
  }

  @Get()
  @Permissions({
    resource: 'inventory:assets',
    action: 'read',
    scope: 'tenant',
  })
  async findAllFixed(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.fixedAssetsService.findAllFixed(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'inventory:assets',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: FixedAssetPaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    const result = await this.fixedAssetsService.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
    return {
      message: 'Lista de activos fijos paginada',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:assets',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.fixedAssetsService.findOne(id, targetTenantId);
    return {
      message: 'Activo fijo encontrado',
      data: result,
    };
  }

  @Patch(':id')
  @Permissions({
    resource: 'inventory:assets',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFixedAssetDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const result = await this.fixedAssetsService.update(
      id,
      dto as Parameters<typeof this.fixedAssetsService.update>[1],
      targetTenantId,
      userId,
    );
    return {
      message: 'Activo fijo actualizado exitosamente',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'inventory:assets',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.fixedAssetsService.remove(id, targetTenantId, userId);
  }
}
