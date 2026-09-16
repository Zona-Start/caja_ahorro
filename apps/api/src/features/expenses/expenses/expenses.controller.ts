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
import { CreateExpenseDto, FilterExpenseDto } from './dto/expenses.schema';
import { ExpensesService } from './expenses.service';

const RejectBodySchema = { reason: '' } as const;

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly service: ExpensesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:expenses',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({
    summary:
      'Register an expense (adaptive use case) - starts as PENDING_APPROVAL',
  })
  async create(@Req() req: any, @Body() dto: CreateExpenseDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const userPermissions = (req.userPermissions ?? []) as string[];
    const data = await this.service.create(
      userId,
      targetTenantId,
      userPermissions,
      dto,
    );
    return { message: 'Gasto registrado correctamente', data };
  }

  @Get('/mode')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get the tenant expense mode (AGILE | CORPORATE)' })
  async getMode(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.getMode(targetTenantId);
    return { message: 'Modo de gastos obtenido correctamente', data };
  }

  @Get('/config')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({
    summary: 'Get fiscal config: VAT/ISLR rates + BCV exchange rates',
  })
  async getExpenseConfig(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.getExpenseConfig(targetTenantId);
    return { message: 'Configuración de gastos obtenida correctamente', data };
  }

  @Patch(':id/approve')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({
    summary:
      'Approve a pending expense (moves to APPROVED / Por Pagar, no money movement)',
  })
  async approve(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const userPermissions = (req.userPermissions ?? []) as string[];
    const data = await this.service.approve(
      id,
      userId,
      targetTenantId,
      userPermissions,
    );
    return { message: 'Gasto aprobado correctamente', data };
  }

  @Patch(':id/pay')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({
    summary:
      'Register the actual payment of an approved expense: deducts the source (cash/fund or bank movement) + accounting entry',
  })
  async pay(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.pay(id, userId, targetTenantId);
    return { message: 'Gasto pagado correctamente', data };
  }

  @Patch(':id/reject')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Reject a pending expense with an optional reason' })
  async reject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string } = RejectBodySchema as never,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.reject(
      id,
      userId,
      targetTenantId,
      body?.reason,
    );
    return { message: 'Gasto rechazado correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated expenses' })
  async findAllByPagination(@Req() req: any, @Query() dto: FilterExpenseDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Gastos obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get()
  @Permissions({
    resource: 'treasury:expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get all expenses' })
  async findAll(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAllByPagination(targetTenantId, {
      page: 1,
      limit: 1000,
    });
    return { message: 'Gastos obtenidos correctamente', data: result.data };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get an expense by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Gasto obtenido correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:expenses',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Soft delete an expense' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.softDelete(id, userId, targetTenantId);
  }
}
