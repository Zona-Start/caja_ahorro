import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateSupplierPaymentAdvanceSchema,
  CreateSupplierPaymentSchema,
  ReversePaymentsSchema,
} from './dto/supplier-payments.schema';
import { SupplierPaymentsService } from './supplier-payments.service';

@ApiTags('purchasing/supplier-payments')
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

  @Get('/by-suppliers')
  @ApiOperation({ summary: 'Get supplier payments by multiple suppliers' })
  @ApiResponse({ status: 200, description: 'Return filtered payments.' })
  async findBySuppliers(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.findAllPaymentBySuppliers(
      dto,
      targetTenantId,
    );
    return { message: 'Payments fetched successfully', data: result };
  }

  @Get('/pending')
  @ApiOperation({ summary: 'Get payment pending' })
  @ApiResponse({ status: 200, description: 'Return payment pending.' })
  async getPaymentPending(@Req() req: any, @Query() paginationDto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getPaymentPending(
      paginationDto,
      targetTenantId,
    );
    return {
      message: 'Payment pending fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/get-one-account-payable/:id')
  @ApiOperation({
    summary: 'Get all supplier payment by account payable available',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier payment by account payable.',
  })
  async getOneSupplierPaymentByAccountId(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result =
      await this.supplierPaymentsService.getOneSupplierPaymentByAccountId(
        id,
        targetTenantId,
      );
    return {
      message: 'Supplier Payment by account payable fetched successfully',
      data: result.data,
    };
  }

  @Get('/all-credits')
  @ApiOperation({ summary: 'Get all available credits (advances + credit notes) globally' })
  @ApiResponse({ status: 200, description: 'Return all available credits.' })
  async findAllCredits(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.supplierPaymentsService.findAllCredits(targetTenantId);
    return { message: 'Credits fetched successfully', data };
  }

  @Get('/supplier-available-credits/:id')
  @ApiOperation({ summary: 'Get all supplier available credits' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier available credits.',
  })
  async findSupplierAvailableCredits(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result =
      await this.supplierPaymentsService.getSupplierAvailableCredits(
        id,
        targetTenantId,
      );
    return {
      message: 'Supplier Available Credits fetched successfully',
      data: result,
    };
  }

  @Get('history/accounts-payable/:id')
  @ApiOperation({ summary: 'Get payment history for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return payment history.' })
  async getPaymentHistory(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.supplierPaymentsService.getPaymentHistory(
      id,
      targetTenantId,
    );
    return {
      message: 'History fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier payment by ID' })
  @ApiResponse({ status: 200, description: 'Return the payment.' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.supplierPaymentsService.findOne(id, targetTenantId);
    return { message: 'Payment fetched successfully', data };
  }

  @Post('pay')
  @UsePipes(new ZodValidatorPipe(CreateSupplierPaymentSchema))
  @ApiOperation({ summary: 'Create and execute a supplier payment' })
  @ApiResponse({ status: 201, description: 'Payment processed.' })
  createAndExecutePayment(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.createAndExecutePayment(
      dto,
      userId,
      targetTenantId,
    );
  }

  @Post('pay-advance')
  @UsePipes(new ZodValidatorPipe(CreateSupplierPaymentAdvanceSchema))
  @ApiOperation({ summary: 'Create an advance payment to a supplier' })
  @ApiResponse({ status: 201, description: 'Advance payment created.' })
  createPayAdvance(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.createPayAdvance(
      dto,
      userId,
      targetTenantId,
    );
  }

  @Post('reverse')
  @UsePipes(new ZodValidatorPipe(ReversePaymentsSchema))
  @ApiOperation({ summary: 'Reverse one or more supplier payments' })
  @ApiResponse({ status: 200, description: 'Payments reversed.' })
  reverse(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.supplierPaymentsService.reverse(dto, userId, targetTenantId);
  }
}
