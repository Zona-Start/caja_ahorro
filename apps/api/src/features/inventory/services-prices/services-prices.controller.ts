import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ServicePricePaginationDto } from './dto/pagination-service-price.dto';
import { CreateServicePriceDto } from './dto/services-prices.schema';
import { ServicePricesService } from './services-prices.service';

@Controller('inventory/services-prices')
export class ServicePricesController {
  constructor(
    private readonly service: ServicePricesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:service_prices',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateServicePriceDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(
      dto as Parameters<typeof this.service.create>[0],
      userId,
      targetTenantId!,
    );
  }

  @Get()
  @Permissions({
    resource: 'inventory:service_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: ServicePricePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:service_prices',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(id);
  }
}
