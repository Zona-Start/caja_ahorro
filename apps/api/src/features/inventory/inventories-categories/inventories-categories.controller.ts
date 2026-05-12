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
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
} from './dto/inventories-categories.schema';
import { InventoryCategoryPaginationDto } from './dto/pagination-inventory-category.dto';
import { InventoriesCategoriesService } from './inventories-categories.service';

@Controller('inventory/categories')
export class InventoriesCategoriesController {
  constructor(
    private readonly service: InventoriesCategoriesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'inventory:categories',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateInventoryCategoryDto) {
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
    resource: 'inventory:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findAll(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'inventory:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: InventoryCategoryPaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.service.findAllByPagination(targetTenantId, paginationDto);
  }

  @Get('group/:group')
  @Permissions({
    resource: 'inventory:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findAllByGroup(@Req() req: Request, @Param('group') group: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAllByGroup(group, targetTenantId);
  }

  @Get(':id')
  @Permissions({
    resource: 'inventory:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'inventory:categories',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryCategoryDto,
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
    resource: 'inventory:categories',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.remove(id, targetTenantId, userId);
  }
}
