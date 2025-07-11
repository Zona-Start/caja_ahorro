import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';

@ApiTags('accounts-payable/invoices')
@Controller('accounts-payable/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:invoice')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully.',
    type: Invoice,
  })
  async create(
    @Req() req: Request,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    const userId = req['user'].id;
    return await this.invoicesService.create(userId, createInvoiceDto);
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:invoices')
  @ApiOperation({ summary: 'Get all invoices with pagination and filters' })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    type: Number,
    description: 'Filter by supplier ID',
  })
  @ApiQuery({
    name: 'invoiceNumber',
    required: false,
    type: String,
    description: 'Filter by invoice number',
  })
  @ApiQuery({
    name: 'invoiceDateStart',
    required: false,
    type: String,
    description: 'Filter by invoice date (start)',
  })
  @ApiQuery({
    name: 'invoiceDateEnd',
    required: false,
    type: String,
    description: 'Filter by invoice date (end)',
  })
  @ApiQuery({
    name: 'dueDateStart',
    required: false,
    type: String,
    description: 'Filter by due date (start)',
  })
  @ApiQuery({
    name: 'dueDateEnd',
    required: false,
    type: String,
    description: 'Filter by due date (end)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by invoice status',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated invoices.',
    type: [Invoice],
  })
  async findAll(@Query() filterInvoiceDto: FilterInvoiceDto) {
    const result = await this.invoicesService.findAll(filterInvoiceDto);
    return {
      message: 'Invoices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/summary')
  @Roles('admin')
  @RequirePermissions('read:invoices')
  @ApiOperation({ summary: 'Get summary invoice' })
  @ApiResponse({
    status: 200,
    description: 'Return the invoice.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async findCountSuppliers() {
    return await this.invoicesService.getInvoicePayableStatus();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:invoice')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the invoice.',
    type: Invoice,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async findOne(@Param('id') id: string) {
    return await this.invoicesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:invoice')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully.',
    type: Invoice,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    const userId = req['user'].id;
    return await this.invoicesService.update(userId, +id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:invoice')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async remove(@Param('id') id: string) {
    return await this.invoicesService.remove(+id);
  }
}
