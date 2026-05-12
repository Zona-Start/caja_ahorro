import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAdvanceSupplierSchema, CreateSupplierTransactionSchema } from './dto/accounts-payable.schema';

@ApiTags('administration/accounts-payable')
@Controller('administration/accounts-payable')
export class AccountsPayableController {
  constructor(
    private readonly service: AccountsPayableService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('/paginated')
  @ApiOperation({ summary: 'Get all accounts payable' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all accounts payable.' })
  async findAll(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAll(dto, targetTenantId);
    return {
      message: 'Accounts payable fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/by-suppliers')
  @ApiOperation({ summary: 'Get all accounts payable by suppliers' })
  @ApiResponse({
    status: 200,
    description: 'Return all accounts payable by suppliers',
  })
  async findBySuppliers(
    @Req() req: any,
    @Query('supplierIds', new ParseArrayPipe({ items: String }))
    supplierIds: string[],
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAccountsPayableBySuppliers(supplierIds, targetTenantId);
    return {
      message: 'Cuentas por pagar obtenidas exitosamente.',
      data: data,
    };
  }

  @Get('/applied-transactions/:id')
  @ApiOperation({ summary: 'Get applied transactions for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return applied transactions.' })
  async getAppliedTransactions(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.getAppliedTransactions(id, targetTenantId);
    return {
      message: 'Applied transactions fetched successfully',
      data: result,
    };
  }

  @Get('/applied-transaction/:id')
  @ApiOperation({ summary: 'Get applied transactions for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return applied transactions.' })
  async getAppliedTransaction(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.getAppliedTransaction(id, targetTenantId);
    return {
      message: 'Applied transactions fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account payable by ID' })
  @ApiResponse({ status: 200, description: 'Return the account payable.' })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Account payable fetched successfully', data };
  }

  @Patch('/authorize/:id')
  @ApiOperation({ summary: 'Authorize an account payable' })
  @ApiResponse({
    status: 200,
    description: 'Account payable authorized successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async autorize(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.autorize(userId, id, targetTenantId);
    return { message: 'Account payable authorized successfully', data };
  }

  @Post('advance')
  async createAdvancePayment(
    @Req() req: any,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.createAdvanceSupplier(dto, userId, targetTenantId);
  }

  @Post('/transaction/credit-debit-note')
  @ApiOperation({ summary: 'Create a new credit/debit note' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  async createCreditDebitNote(
    @Req() req: any,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.createCreditDebitNote(userId, dto, targetTenantId);
    return { message: 'Transaction created successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account payable' })
  @ApiResponse({
    status: 200,
    description: 'Account payable deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, targetTenantId);
  }
}
