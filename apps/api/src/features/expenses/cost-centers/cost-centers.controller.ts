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
import { CostCentersService } from './cost-centers.service';
import {
  BudgetUsageDto,
  CreateCostCenterDto,
  FilterCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-centers.schema';

@ApiTags('expenses/cost-centers')
@Controller('cost-centers')
export class CostCentersController {
  constructor(
    private readonly service: CostCentersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create a cost center' })
  async create(@Req() req: any, @Body() dto: CreateCostCenterDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Centro de costo creado correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated cost centers' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterCostCenterDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Centros de costo obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get()
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get all cost centers' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Centros de costo obtenidos correctamente', data };
  }

  @Get('/budget/:id')
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get budget usage for a cost center' })
  async getBudgetUsage(
    @Req() req: any,
    @Param('id') id: string,
    @Query() dto: BudgetUsageDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const data = await this.service.getBudgetUsage(
      targetTenantId,
      id,
      dto.month,
    );
    return { message: 'Consumo de presupuesto obtenido correctamente', data };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a cost center by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Centro de costo obtenido correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update a cost center' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Centro de costo actualizado correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:cost-centers',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Deactivate a cost center' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
