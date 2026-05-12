import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProductPricePaginationDto } from './dto/pagination-product-price.dto';
import { CreateProductPriceDto } from './dto/product-prices.schema';
import { ProductPricesService } from './product-prices.service';

@Controller('inventory/product-prices')
export class ProductPricesController {
  constructor(
    private readonly service: ProductPricesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:product_prices',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateProductPriceDto) {
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
    resource: 'inventory:product_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: ProductPricePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:product_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(id);
  }
}
