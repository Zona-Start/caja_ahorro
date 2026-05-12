import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { FixedAssetPricePaginationDto } from './dto/pagination-fixed-asset-price.dto';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@Controller('inventory/fixed-asset-prices')
export class FixedAssetPricesController {
  constructor(
    private readonly service: FixedAssetPricesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:fixed_asset_prices',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: unknown) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(
      dto as Parameters<typeof this.service.create>[0],
      userId,
      targetTenantId,
    );
  }

  @Get()
  @Permissions({
    resource: 'inventory:fixed_asset_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: FixedAssetPricePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:fixed_asset_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(id);
  }
}
