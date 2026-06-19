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
import { ProductServiceSupplierPaginationDto } from './dto/pagination-product-service-supplier.dto';
import {
  CreateProductServiceSupplierDto,
  UpdateProductServiceSupplierDto,
} from './dto/product-service-suppliers.schema';
import { ProductServiceSuppliersService } from './product-service-suppliers.service';

@Controller('inventory/product-service-suppliers')
export class ProductServiceSuppliersController {
  constructor(
    private readonly service: ProductServiceSuppliersService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post()
  @Permissions({
    resource: 'inventory:products',
    action: 'create',
    scope: 'tenant',
  })
  async create(
    @Req() req: Request,
    @Body() dto: CreateProductServiceSupplierDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(
      dto as Parameters<typeof this.service.create>[0],
      targetTenantId,
      userId,
    );
  }

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
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions({
    resource: 'inventory:products',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductServiceSupplierDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.update(
      id,
      dto as Parameters<typeof this.service.update>[1],
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'inventory:products',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.remove(id, targetTenantId, userId);
  }
}
