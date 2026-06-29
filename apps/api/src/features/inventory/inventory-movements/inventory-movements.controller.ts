import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
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
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from './dto/inventory-movements.schema';
import { InventoryMovementPaginationDto } from './dto/pagination-inventory-movement.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@Controller('inventory/movements')
export class InventoryMovementsController {
  constructor(
    private readonly service: InventoryMovementsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:stock',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateInventoryMovementDto) {
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
    resource: 'inventory:stock',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: InventoryMovementPaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    const result = await this.service.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
    return {
      message: 'Lista de movimientos de inventario',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('stock/:productId')
  @Permissions({
    resource: 'inventory:stock',
    action: 'read',
    scope: 'tenant',
  })
  async getItemStock(
    @Req() req: Request,
    @Param('productId') productId: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.getItemStock(productId, targetTenantId);
    return {
      message: 'Stock del producto',
      data: result,
    };
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:stock',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findOne(id, targetTenantId);
    return {
      message: 'Movimiento de inventario encontrado',
      data: result,
    };
  }

  @Patch(':id')
  @Permissions({
    resource: 'inventory:stock',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryMovementDto,
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

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    resource: 'inventory:stock',
    action: 'delete',
    scope: 'tenant',
  })
  async cancel(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.cancel(id, targetTenantId, userId);
  }
}
