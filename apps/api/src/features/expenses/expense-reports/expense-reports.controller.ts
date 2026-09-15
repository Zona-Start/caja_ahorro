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
  CreateExpenseReportDto,
  FilterExpenseReportDto,
  PayExpenseReportDto,
  RejectExpenseReportDto,
  UpdateExpenseReportDto,
} from './dto/expense-reports.schema';
import { ExpenseReportsService } from './expense-reports.service';

const EMPTY_BODY = {} as never;

@ApiTags('expenses/expense-reports')
@Controller('expense-reports')
export class ExpenseReportsController {
  constructor(
    private readonly service: ExpenseReportsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({
    summary: 'Create an expense report (employee reimbursement)',
  })
  async create(@Req() req: any, @Body() dto: CreateExpenseReportDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Reporte de gastos creado correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated expense reports (payment queue)' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterExpenseReportDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Reportes de gastos obtenidos correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get an expense report with its items' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOneWithItems(id, targetTenantId);
    return { message: 'Reporte de gastos obtenido correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update a PENDING report' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseReportDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Reporte actualizado correctamente', data };
  }

  @Patch('approve/:id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Approve a PENDING report (goes to payment queue)' })
  async approve(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.approve(id, userId, targetTenantId);
    return { message: 'Reporte aprobado correctamente', data };
  }

  @Patch('reject/:id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Reject a PENDING report with a reason' })
  async reject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RejectExpenseReportDto = EMPTY_BODY,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.reject(
      id,
      userId,
      targetTenantId,
      dto?.reason,
    );
    return { message: 'Reporte rechazado correctamente', data };
  }

  @Patch('pay/:id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'approve',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Pay an APPROVED report (deducts bank/petty cash)' })
  async pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: PayExpenseReportDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.pay(id, userId, targetTenantId, dto);
    return { message: 'Reembolso pagado correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:expense-reports',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Delete a PENDING report' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
