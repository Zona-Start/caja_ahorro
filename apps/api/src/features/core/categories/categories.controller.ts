import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/categories.dto';

@Controller('core/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly tenantService: TenantContextService,
  ) { }

  @Get()
  @Permissions({
    resource: 'catalog:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findAll(@Query() dto: CategoryQueryDto, @Req() req: Request) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);

    return this.categoriesService.findAll(dto, targetTenantId);
  }

  @Get(':id')
  @Permissions({
    resource: 'catalog:categories',
    action: 'read',
    scope: 'tenant',
  })
  async findById(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Req() req: Request,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );

    return this.categoriesService.findById(id, targetTenantId);
  }

  @Post()
  @Permissions({
    resource: 'catalog:categories',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Body() dto: CreateCategoryDto, @Req() req: Request) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );

    console.log('tenantId', targetTenantId);


    return this.categoriesService.create(dto, targetTenantId, userId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'catalog:categories',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );
    return this.categoriesService.update(id, dto, targetTenantId, userId);
  }

  @Delete(':id')
  @Permissions({
    resource: 'catalog:categories',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Param('id') id: string, @Query('tenantId') tenantId: string, @Req() req: Request) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, tenantId);
    return this.categoriesService.remove(id, targetTenantId);
  }
}
