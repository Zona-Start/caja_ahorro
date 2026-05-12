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
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateInventoryMovementDto } from './dto/inventory-movements.schema';
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
    resource: 'inventory:movements',
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
    resource: 'inventory:movements',
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
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get('stock/:itemType/:itemId')
  @Permissions({
    resource: 'inventory:movements',
    action: 'read',
    scope: 'tenant',
  })
  async getItemStock(
    @Req() req: Request,
    @Param('itemType') itemType: 'PRODUCT' | 'FIXED_ASSET',
    @Param('itemId') itemId: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.getItemStock(itemId, itemType, targetTenantId);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:movements',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(id, targetTenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'inventory:movements',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.remove(id, targetTenantId, userId);
  }
}
