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
  CreatePettyCashVoucherDto,
  FilterPettyCashVoucherDto,
  LiquidatePettyCashVoucherDto,
  UpdatePettyCashVoucherDto,
} from './dto/petty-cash-vouchers.schema';
import { PettyCashVouchersService } from './petty-cash-vouchers.service';

@ApiTags('expenses/petty-cash-vouchers')
@Controller('petty-cash-vouchers')
export class PettyCashVouchersController {
  constructor(
    private readonly service: PettyCashVouchersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Issue a petty cash voucher' })
  async create(@Req() req: any, @Body() dto: CreatePettyCashVoucherDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Vale emitido correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated petty cash vouchers' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterPettyCashVoucherDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Vales obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a voucher by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Vale obtenido correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update an OPEN voucher' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePettyCashVoucherDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Vale actualizado correctamente', data };
  }

  @Patch('liquidate/:id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Liquidate a voucher into a formal expense' })
  async liquidate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: LiquidatePettyCashVoucherDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.liquidate(id, userId, targetTenantId, dto);
    return { message: 'Vale liquidado correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:petty-cash',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({
    summary: 'Void an OPEN voucher (funds returned to the fund)',
  })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.voidVoucher(id, userId, targetTenantId);
  }
}
