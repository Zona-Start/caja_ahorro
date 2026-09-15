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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateExpenseCategoryDto,
  FilterExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-categories.schema';
import { ExpenseCategoriesService } from './expense-categories.service';

@ApiTags('expenses/expense-categories')
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly service: ExpenseCategoriesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create an expense category' })
  async create(@Req() req: any, @Body() dto: CreateExpenseCategoryDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Categoría de gasto creada correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated expense categories' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterExpenseCategoryDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Categorías de gasto obtenidas correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get()
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get all expense categories' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Categorías de gasto obtenidas correctamente', data };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get an expense category by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Categoría de gasto obtenida correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update an expense category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Categoría de gasto actualizada correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:expense-categories',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Deactivate an expense category' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
