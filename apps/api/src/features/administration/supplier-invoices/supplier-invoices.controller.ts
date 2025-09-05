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
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { FilterSupplierInvoiceDto } from './dto/filter-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';
import { SupplierInvoicesService } from './supplier-invoices.service';

@ApiTags('administration/supplier-invoices')
@Controller('administration/supplier-invoices')
export class SupplierInvoicesController {
  constructor(private readonly services: SupplierInvoicesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:supplier-invoice')
  @ApiOperation({ summary: 'Create a new supplier invoice' })
  @ApiResponse({
    status: 201,
    description: 'Supplier invoice created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateSupplierInvoiceDto) {
    const userId = req['user'].id;
    return await this.services.create(userId, dto);
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:supplier-invoices')
  @ApiOperation({ summary: 'Get all supplier invoices' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all supplier invoices.' })
  async findAll(@Query() paginationDto: FilterSupplierInvoiceDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Supplier invoices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/supplier-available-credits/:id')
  @Roles('admin')
  @RequirePermissions('read:supplier-invoices')
  @ApiOperation({ summary: 'Get all supplier available credits' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier supplier available credits.',
  })
  async findSupplierAvailableCredits(@Param('id') id: string) {
    const result = await this.services.getSupplierAvailableCredits(+id);
    return {
      message: 'Supplier Available Credits fetched successfully',
      data: result,
    };
  }

  @Get('/status/draft-pending')
  @Roles('admin')
  @RequirePermissions('read:supplier-invoices')
  @ApiOperation({ summary: 'Get all supplier invoices by draft and pending' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier invoices by draft and pending.',
  })
  async findDraftPending() {
    const result = await this.services.findDraftPendiend();
    return {
      message: 'Supplier invoices fetched by draft and pending successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:supplier-invoice')
  @ApiOperation({ summary: 'Get a supplier invoice by ID' })
  @ApiResponse({ status: 200, description: 'Return the supplier invoice.' })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Supplier invoice fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:supplier-invoice')
  @ApiOperation({ summary: 'Update a supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierInvoiceDto,
  ) {
    const userId = req['user'].id;
    return await this.services.update(+id, userId, dto);
  }

  @Patch('/accountFor/:id')
  @Roles('admin')
  @RequirePermissions('update:supplier-invoice')
  @ApiOperation({ summary: 'Update a supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found.' })
  async accountFor(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierInvoiceDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.accountFor(userId, +id, dto);
    return { message: 'Supplier invoice updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:supplier-invoice')
  @ApiOperation({ summary: 'Delete a supplier invoice' })
  @ApiResponse({
    status: 200,
    description: 'Supplier invoice deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Supplier invoice not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
