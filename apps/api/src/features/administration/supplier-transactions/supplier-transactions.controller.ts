import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilterSupplierTransactionDto } from './dto/filter-supplier-transaction.dto';
import { SupplierTransactionsService } from './supplier-transactions.service';

@ApiTags('administration/supplier-transactions')
@Controller('administration/supplier-transactions')
export class SupplierTransactionsController {
  constructor(private readonly services: SupplierTransactionsService) {}

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:supplier-transactions')
  @ApiOperation({ summary: 'Get all supplier transactions' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier transactions.',
  })
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
}
