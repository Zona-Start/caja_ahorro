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
import {
  ClosePettyCashSettlementDto,
  FilterPettyCashSettlementDto,
  OpenPettyCashSettlementDto,
} from './dto/petty-cash-settlements.schema';
import { PettyCashSettlementsService } from './petty-cash-settlements.service';

@ApiTags('expenses/petty-cash-settlements')
@Controller('petty-cash-settlements')
export class PettyCashSettlementsController {
  constructor(
    private readonly service: PettyCashSettlementsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({
    summary: 'Open (or refresh) the monthly settlement for a fund',
  })
  async open(@Req() req: any, @Body() dto: OpenPettyCashSettlementDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.open(userId, targetTenantId, dto);
    return { message: 'Arqueo abierto correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated settlements' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterPettyCashSettlementDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Arqueos obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id/refresh')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Recalculate settlement totals live' })
  async refresh(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.refreshSettlement(id, targetTenantId);
    return { message: 'Arqueo refrescado correctamente', data };
  }

  @Patch('close/:id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Close a settlement with the physical count' })
  async close(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ClosePettyCashSettlementDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.close(id, userId, targetTenantId, dto);
    return { message: 'Arqueo cerrado correctamente', data };
  }
}
