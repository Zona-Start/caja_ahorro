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
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';
import { FilterSupplierTransactionDto } from './dto/filter-supplier-transaction.dto';
import { UpdateSupplierTransactionDto } from './dto/update-supplier-transaction.dto';
import { SupplierTransactionsService } from './supplier-transactions.service';

@ApiTags('administration/supplier-transactions')
@Controller('administration/supplier-transactions')
export class SupplierTransactionsController {
  constructor(private readonly services: SupplierTransactionsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:supplier-transaction')
  @ApiOperation({ summary: 'Create a new supplier transaction' })
  @ApiResponse({
    status: 201,
    description: 'Supplier transaction created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateSupplierTransactionDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Supplier transaction created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:supplier-transactions')
  @ApiOperation({ summary: 'Get all supplier transactions' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all supplier transactions.' })
  async findAll(@Query() paginationDto: FilterSupplierTransactionDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Supplier transactions fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:supplier-transaction')
  @ApiOperation({ summary: 'Get a supplier transaction by ID' })
  @ApiResponse({ status: 200, description: 'Return the supplier transaction.' })
  @ApiResponse({ status: 404, description: 'Supplier transaction not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Supplier transaction fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:supplier-transaction')
  @ApiOperation({ summary: 'Update a supplier transaction' })
  @ApiResponse({
    status: 200,
    description: 'Supplier transaction updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Supplier transaction not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierTransactionDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Supplier transaction updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:supplier-transaction')
  @ApiOperation({ summary: 'Delete a supplier transaction' })
  @ApiResponse({
    status: 200,
    description: 'Supplier transaction deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Supplier transaction not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
