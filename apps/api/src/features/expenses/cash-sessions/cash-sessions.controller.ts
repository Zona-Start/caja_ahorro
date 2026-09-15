import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashSessionsService } from './cash-sessions.service';
import {
  CloseCashSessionDto,
  FilterCashSessionDto,
  OpenCashSessionDto,
} from './dto/cash-sessions.schema';

@ApiTags('expenses/cash-sessions')
@Controller('cash-sessions')
export class CashSessionsController {
  constructor(
    private readonly service: CashSessionsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('/open')
  @Permissions({
    resource: 'treasury:cash-sessions',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Open a cash register session' })
  async open(@Req() req: any, @Body() dto: OpenCashSessionDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.open(userId, targetTenantId, dto);
    return { message: 'Sesión de caja abierta correctamente', data };
  }

  @Patch('/close/:id')
  @Permissions({
    resource: 'treasury:cash-sessions',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Close a cash register session (Corte Z)' })
  async close(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CloseCashSessionDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.close(id, userId, targetTenantId, dto);
    return { message: 'Sesión de caja cerrada correctamente', data };
  }

  @Get('/active/:cashRegisterId')
  @Permissions({
    resource: 'treasury:cash-sessions',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get active session for a cash register' })
  async findActive(
    @Req() req: any,
    @Param('cashRegisterId') cashRegisterId: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findActiveByRegister(
      targetTenantId,
      cashRegisterId,
    );
    return { message: 'Sesión activa obtenida correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:cash-sessions',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated cash sessions' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterCashSessionDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Sesiones de caja obtenidas correctamente',
      data: result.data,
      meta: result.meta,
    };
  }
}
