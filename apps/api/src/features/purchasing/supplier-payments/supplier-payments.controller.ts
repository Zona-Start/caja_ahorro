import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { SupplierPaymentsService } from './supplier-payments.service';

@Controller('administration/supplier-payments')
export class SupplierPaymentsController {
  constructor(
    private readonly supplierPaymentsService: SupplierPaymentsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all supplier payments' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all supplier payments.' })
  findAll(@Req() req: any, @Query() paginationDto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.supplierPaymentsService.findAll(paginationDto, targetTenantId);
  }

  @Get('/pending')
  @ApiOperation({ summary: 'Get payment pending' })
  @ApiResponse({ status: 200, description: 'Return payment pending.' })
  async getPaymentPending(@Req() req: any, @Query() paginationDto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getPaymentPending(paginationDto, targetTenantId);
    return {
      message: 'Payment pending fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post('pay-advance')
  createPayAdvance(
    @Req() req: any,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.createPayAdvance(dto, userId, targetTenantId);
  }

  @Get('/get-one-account-payable/:id')
  @ApiOperation({
    summary: 'Get all supplier payment by account payable available',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier payment by account payable.',
  })
  async getOneSupplierPaymentByAccountId(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getOneSupplierPaymentByAccountId(id, targetTenantId);
    return {
      message: 'Supplier  Payment by account payable fetched successfully',
      data: result.data,
    };
  }

  @Get('/supplier-available-credits/:id')
  @ApiOperation({ summary: 'Get all supplier available credits' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier supplier available credits.',
  })
  async findSupplierAvailableCredits(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getSupplierAvailableCredits(id, targetTenantId);
    return {
      message: 'Supplier Available Credits fetched successfully',
      data: result,
    };
  }

  @Post('pay')
  createAndExecutePayment(
    @Req() req: any,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.createAndExecutePayment(
      dto,
      userId,
      targetTenantId,
    );
  }

  @Get('history/accounts-payable/:id')
  @ApiOperation({ summary: 'Get payment history for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return payment history.' })
  async getPaymentHistory(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getPaymentHistory(id, targetTenantId);
    return {
      message: 'History fetched successfully',
      data: result,
    };
  }

  @Post('reverse')
  reverse(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.reverse(dto, userId, targetTenantId);
  }
}
