import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashMovementsService } from './cash-movements.service';
import {
  CreateCashMovementDto,
  FilterCashMovementDto,
} from './dto/cash-movements.schema';

@ApiTags('expenses/cash-movements')
@Controller('cash-movements')
export class CashMovementsController {
  constructor(
    private readonly service: CashMovementsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:cash-movements',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Register a manual cash movement' })
  async create(@Req() req: any, @Body() dto: CreateCashMovementDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Movimiento de caja registrado correctamente', data };
  }

  @Get('/session/:sessionId')
  @Permissions({
    resource: 'treasury:cash-movements',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get movements by session' })
  async findBySession(@Req() req: any, @Param('sessionId') sessionId: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findBySession(sessionId, targetTenantId);
    return { message: 'Movimientos obtenidos correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:cash-movements',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated cash movements' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterCashMovementDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Movimientos de caja obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }
}
