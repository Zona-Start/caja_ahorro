import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerPaymentsService } from './customer-payments.service';
import {
  CreateCustomerPaymentDto,
  FilterCustomerPaymentDto,
  FilterReceivableDto,
} from './dto/customer-payments.schema';

@ApiTags('sales/payments')
@Controller('sales/payments')
export class CustomerPaymentsController {
  constructor(
    private readonly paymentsService: CustomerPaymentsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({ resource: 'sales:payments', action: 'create', scope: 'tenant' })
  @ApiOperation({ summary: 'Register a customer payment (receivable collection)' })
  async create(@Req() req: any, @Body() dto: CreateCustomerPaymentDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.paymentsService.create(targetTenantId, userId, {
      customerId: dto.customerId,
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      cashRegisterSessionId: dto.cashRegisterSessionId,
      referenceNumber: dto.referenceNumber,
      paymentDate: dto.paymentDate,
      notes: dto.notes,
    });
  }

  @Get('/paginated')
  @Permissions({ resource: 'sales:payments', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'List customer payments with pagination' })
  async findAll(@Req() req: any, @Query() dto: FilterCustomerPaymentDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.paymentsService.findAllByPagination(targetTenantId, dto);
  }

  @Get('/receivables')
  @Permissions({ resource: 'sales:payments', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'List outstanding credit invoices (CxC)' })
  async findReceivables(@Req() req: any, @Query() dto: FilterReceivableDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.paymentsService.findReceivables(targetTenantId, dto);
  }
}
