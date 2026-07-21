import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
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
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service';
import {
  ApplyAdvanceSchema,
  ApplyCreditNoteSchema,
  ApplyDebitNoteSchema,
  UnapplyTransactionSchema,
  UpdateAccountPayableSchema,
} from './dto/accounts-payable.schema';

@ApiTags('purchasing/accounts-payable')
@Controller('purchasing/accounts-payable')
export class AccountsPayableController {
  constructor(
    private readonly service: AccountsPayableService,
    private readonly tenantContextService: TenantContextService,
  ) { }

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
    const data = await this.service.findAccountsPayableBySuppliers(
      supplierIds,
      targetTenantId,
    );
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
    const result = await this.service.getAppliedTransactions(
      id,
      targetTenantId,
    );
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

  @Patch(':id')
  @UsePipes(new ZodValidatorPipe(UpdateAccountPayableSchema))
  @ApiOperation({ summary: 'Update an account payable' })
  @ApiResponse({ status: 200, description: 'Account payable updated.' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(userId, id, dto, targetTenantId);
    return { message: 'Account payable updated successfully', data };
  }

  @Patch('/authorize/:id')
  @ApiOperation({ summary: 'Authorize an account payable' })
  @ApiResponse({
    status: 200,
    description: 'Account payable authorized successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async autorize(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.service.autorize(userId, id, targetTenantId);
    return { message: 'Account payable authorized successfully', data };
  }

  @Post('/:id/apply-credit-note')
  @UsePipes(new ZodValidatorPipe(ApplyCreditNoteSchema))
  @ApiOperation({ summary: 'Apply a credit note to an account payable' })
  @ApiResponse({ status: 200, description: 'Credit note applied.' })
  async applyCreditNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.applyCreditNote(
      userId,
      id,
      dto,
      targetTenantId,
    );
  }

  @Post('/:id/apply-debit-note')
  @UsePipes(new ZodValidatorPipe(ApplyDebitNoteSchema))
  @ApiOperation({ summary: 'Apply a debit note to an account payable' })
  @ApiResponse({ status: 200, description: 'Debit note applied.' })
  async applyDebitNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.applyDebitNote(
      userId,
      id,
      dto,
      targetTenantId,
    );
  }

  @Post('/:id/apply-advance')
  @UsePipes(new ZodValidatorPipe(ApplyAdvanceSchema))
  @ApiOperation({ summary: 'Apply an advance to an account payable' })
  @ApiResponse({ status: 200, description: 'Advance applied.' })
  async applyAdvance(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.applyAdvance(
      userId,
      id,
      dto,
      targetTenantId,
    );
  }

  @Post('/:id/unapply/:applicationId')
  @ApiOperation({ summary: 'Revert an applied transaction' })
  @ApiResponse({ status: 200, description: 'Application reverted.' })
  async unapply(
    @Req() req: any,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.unapplyTransaction(
      userId,
      id,
      applicationId,
      targetTenantId,
    );
  }

  @Post('advance')
  async createAdvancePayment(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.createAdvanceSupplier(dto, userId, targetTenantId);
  }

  @Post('/transaction/credit-debit-note')
  @ApiOperation({ summary: 'Create a new credit/debit note' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  async createCreditDebitNote(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.createCreditDebitNote(
      userId,
      dto,
      targetTenantId,
    );
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
