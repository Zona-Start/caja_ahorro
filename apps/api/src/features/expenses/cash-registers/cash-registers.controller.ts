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
import { CashRegistersService } from './cash-registers.service';
import {
  CreateCashRegisterDto,
  FilterCashRegisterDto,
  UpdateCashRegisterDto,
} from './dto/cash-registers.schema';

@ApiTags('expenses/cash-registers')
@Controller('cash-registers')
export class CashRegistersController {
  constructor(
    private readonly service: CashRegistersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create a cash register' })
  async create(@Req() req: any, @Body() dto: CreateCashRegisterDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Caja registradora creada correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated cash registers' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterCashRegisterDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Cajas registradoras obtenidas correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get()
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get all cash registers' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Cajas registradoras obtenidas correctamente', data };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a cash register by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Caja registradora obtenida correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update a cash register' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCashRegisterDto,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Caja registradora actualizada correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:cash-registers',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Deactivate a cash register' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
