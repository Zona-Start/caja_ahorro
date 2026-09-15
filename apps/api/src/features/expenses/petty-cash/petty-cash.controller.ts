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
  CreatePettyCashFundDto,
  DisbursePettyCashDto,
  FilterPettyCashFundDto,
  ReplenishPettyCashDto,
  UpdatePettyCashFundDto,
} from './dto/petty-cash.schema';
import { PettyCashService } from './petty-cash.service';

@ApiTags('expenses/petty-cash-funds')
@Controller('petty-cash-funds')
export class PettyCashController {
  constructor(
    private readonly service: PettyCashService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create a petty cash fund' })
  async create(@Req() req: any, @Body() dto: CreatePettyCashFundDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Fondo fijo creado correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated petty cash funds' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterPettyCashFundDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Fondos fijos obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get()
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get all petty cash funds' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Fondos fijos obtenidos correctamente', data };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a petty cash fund by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Fondo fijo obtenido correctamente', data };
  }

  @Patch('/replenish/:id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Replenish a petty cash fund' })
  async replenish(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReplenishPettyCashDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.replenish(id, userId, targetTenantId, dto);
    return { message: 'Fondo fijo repuesto correctamente', data };
  }

  @Patch('/disburse/:id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Disburse from a petty cash fund' })
  async disburse(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: DisbursePettyCashDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.disburse(id, userId, targetTenantId, dto);
    return { message: 'Desembolso registrado correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update a petty cash fund' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePettyCashFundDto,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Fondo fijo actualizado correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Deactivate a petty cash fund' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
