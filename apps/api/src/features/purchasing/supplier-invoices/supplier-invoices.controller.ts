import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
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
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateCreditNoteSchema,
  CreateDebitNoteSchema,
  CreateSupplierInvoiceSchema,
  FilterSupplierInvoiceSchema,
  StatusTransitionSchema,
  UpdateSupplierInvoiceSchema,
  VoidInvoiceSchema,
} from './dto/supplier-invoices.schema';
import { SupplierInvoicesService } from './supplier-invoices.service';

@ApiTags('purchasing/supplier-invoices')
@Controller('purchasing/supplier-invoices')
export class SupplierInvoicesController {
  constructor(
    private readonly service: SupplierInvoicesService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateSupplierInvoiceSchema))
  @ApiOperation({ summary: 'Create a new supplier invoice' })
  @ApiResponse({
    status: 201,
    description: 'Supplier invoice created successfully.',
  })
  async create(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, dto, targetTenantId);
    return { message: 'Supplier invoice created successfully', data };
  }

  @Post('/credit-notes')
  @UsePipes(new ZodValidatorPipe(CreateCreditNoteSchema))
  @ApiOperation({ summary: 'Create a supplier credit note' })
  @ApiResponse({
    status: 201,
    description: 'Credit note created successfully.',
  })
  async createCreditNote(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.createCreditNote(userId, dto, targetTenantId);
  }

  @Post('/debit-notes')
  @UsePipes(new ZodValidatorPipe(CreateDebitNoteSchema))
  @ApiOperation({ summary: 'Create a supplier debit note' })
  @ApiResponse({
    status: 201,
    description: 'Debit note created successfully.',
  })
  async createDebitNote(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.createDebitNote(userId, dto, targetTenantId);
  }

  @Get('/paginated')
  @ApiOperation({ summary: 'Get all supplier invoices' })
  @ApiResponse({ status: 200, description: 'Return all supplier invoices.' })
  async findAll(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAll(dto, targetTenantId);
    return {
      message: 'Supplier invoices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/status/draft-pending')
  @ApiOperation({ summary: 'Get all supplier invoices by draft and pending' })
  async findDraftPending(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findDraftPending(targetTenantId);
    return {
      message: 'Supplier invoices fetched by draft and pending successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier invoice by ID' })
  @ApiResponse({ status: 200, description: 'Return the supplier invoice.' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Supplier invoice fetched successfully', data };
  }

  @Patch(':id')
  @UsePipes(new ZodValidatorPipe(UpdateSupplierInvoiceSchema))
  @ApiOperation({ summary: 'Update a supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice updated successfully.',
  })
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.update(id, userId, dto, targetTenantId);
  }

  @Patch('/accountFor/:id')
  @ApiOperation({ summary: 'Account for a supplier invoice' })
  async accountFor(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.accountFor(userId, id, dto, targetTenantId);
    return { message: 'Supplier invoice accounted successfully', data };
  }

  @Patch('/void/:id')
  @UsePipes(new ZodValidatorPipe(VoidInvoiceSchema))
  @ApiOperation({ summary: 'Void an accounted supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice voided successfully.',
  })
  async voidInvoice(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.voidInvoice(userId, id, dto, targetTenantId);
  }

  @Patch('/status/:id')
  @UsePipes(new ZodValidatorPipe(StatusTransitionSchema))
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({
    status: 200,
    description: 'Invoice status updated successfully.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return await this.service.updateInvoiceStatus(
      userId,
      id,
      dto,
      targetTenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice deleted successfully.',
  })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, targetTenantId);
  }
}
