import { Permissions } from '@/common/decorators/permissions.decorator';
import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingCyclesService } from './accounting-cycles.service';
import {
  ChangeStatusDto,
  CreateAccountingCycleDto,
  FilterAccountingCycleDto,
  UpdateAccountingCycleDto,
} from './dto/accounting-cycles.schema';

@ApiTags('accounting-cycles')
@Controller('accounting-cycles')
@UseInterceptors(ReqLogInterceptor)
export class AccountingCyclesController {
  constructor(
    private readonly service: AccountingCyclesService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post()
  @Permissions({ resource: 'accounting:cycles', action: 'create', scope: 'tenant' })
  @ApiOperation({ summary: 'Crear un nuevo ciclo contable' })
  @ApiResponse({
    status: 201,
    description: 'Ciclo contable creado exitosamente.',
  })
  async create(@Req() req: any, @Body() dto: CreateAccountingCycleDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(targetTenantId, userId, dto);
    return { message: 'Ciclo contable creado exitosamente', data };
  }

  @Get()
  @Permissions({ resource: 'accounting:cycles', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Obtener todos los ciclos contables' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(targetTenantId);
    return { message: 'Ciclos contables obtenidos exitosamente', data };
  }

  @Get('/paginated')
  @Permissions({ resource: 'accounting:cycles', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Obtener ciclos contables con paginación' })
  async findAllPaginated(
    @Req() req: any,
    @Query() dto: FilterAccountingCycleDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAllPaginated(targetTenantId, dto);
    return {
      message: 'Ciclos contables obtenidos exitosamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Patch(':id/status')
  @Permissions({ resource: 'accounting:cycles', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Cambiar estado de un ciclo contable (Abierto <-> Pendiente)' })
  async changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.changeStatus(
      targetTenantId,
      userId,
      id,
      dto,
    );
    return {
      message: `Ciclo contable cambiado a ${dto.status === 'OPEN' ? 'Abierto' : 'Pendiente'} exitosamente`,
      data,
    };
  }

  @Get(':id')
  @Permissions({ resource: 'accounting:cycles', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Obtener un ciclo contable por ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(targetTenantId, id);
    return { message: 'Ciclo contable obtenido exitosamente', data };
  }



  @Patch(':id')
  @Permissions({ resource: 'accounting:cycles', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Actualizar un ciclo contable' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAccountingCycleDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(targetTenantId, userId, id, dto);
    return { message: 'Ciclo contable actualizado exitosamente', data };
  }

  @Delete(':id')
  @Permissions({ resource: 'accounting:cycles', action: 'delete', scope: 'tenant' })
  @ApiOperation({ summary: 'Eliminar un ciclo contable' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.delete(targetTenantId, userId, id);
    return { message: 'Ciclo contable eliminado exitosamente', data };
  }
}
