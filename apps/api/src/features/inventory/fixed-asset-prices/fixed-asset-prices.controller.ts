import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { FixedAssetPricePaginationDto } from './dto/pagination-fixed-asset-price.dto';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@Controller('inventory/fixed-asset-prices')
export class FixedAssetPricesController {
  constructor(
    private readonly service: FixedAssetPricesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

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
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(id, targetTenantId);
  }
}
