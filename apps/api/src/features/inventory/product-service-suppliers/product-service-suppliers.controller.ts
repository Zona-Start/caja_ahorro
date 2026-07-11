import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProductServiceSupplierPaginationDto } from './dto/pagination-product-service-supplier.dto';
import { ProductServiceSuppliersService } from './product-service-suppliers.service';

@Controller('inventory/product-service-suppliers')
export class ProductServiceSuppliersController {
  constructor(
    private readonly service: ProductServiceSuppliersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @Permissions({
    resource: 'inventory:products',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: ProductServiceSupplierPaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:products',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(id, targetTenantId);
  }
}
