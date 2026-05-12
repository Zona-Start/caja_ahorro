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
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:fixed_assets',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateFixedAssetDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.fixedAssetsService.create(
      dto as Parameters<typeof this.fixedAssetsService.create>[0],
      targetTenantId,
      userId,
    );
  }

  @Get()
  @Permissions({
    resource: 'inventory:fixed_assets',
    action: 'read',
    scope: 'tenant',
  })
  async findAllFixet(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.fixedAssetsService.findAllFixet(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'inventory:fixed_assets',
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
    return this.fixedAssetsService.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:fixed_assets',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.fixedAssetsService.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'inventory:fixed_assets',
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
    return this.fixedAssetsService.update(
      id,
      dto as Parameters<typeof this.fixedAssetsService.update>[1],
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'inventory:fixed_assets',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.fixedAssetsService.remove(id, targetTenantId, userId);
  }
}
