import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupplierTransactionsService } from './supplier-transactions.service';

@ApiTags('administration/supplier-transactions')
@Controller('administration/supplier-transactions')
export class SupplierTransactionsController {
  constructor(private readonly services: SupplierTransactionsService) {}

  // @Get('/paginated')
  // @Roles('admin')
  // @RequirePermissions('read:supplier-transactions')
  // @ApiOperation({ summary: 'Get all supplier transactions' })
  // @ApiQuery({ name: 'search', required: false, type: String })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Return all supplier transactions.',
  // })
  // async findAll(@Query() paginationDto: FilterSupplierTransactionDto) {
  //   const result = await this.services.findAll(paginationDto);
  //   return {
  //     message: 'Supplier transactions fetched successfully',
  //     data: result.data,
  //     meta: result.meta,
  //   };
  // }

  // @Get(':id')
  // @Roles('admin')
  // @RequirePermissions('read:supplier-transaction')
  // @ApiOperation({ summary: 'Get a supplier transaction by ID' })
  // @ApiResponse({ status: 200, description: 'Return the supplier transaction.' })
  // @ApiResponse({ status: 404, description: 'Supplier transaction not found.' })
  // async findOne(@Param('id') id: string) {
  //   const data = await this.services.findOne(+id);
  //   return { message: 'Supplier transaction fetched successfully', data };
  // }

  @Get('/advance')
  @Roles('admin')
  @RequirePermissions('read:supplier-transactions-advance')
  @ApiOperation({ summary: 'Get all supplier transactions advance' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier transactions advance.',
  })
  async getSupplierTransactionAdvance() {
    const result = await this.services.getSupplierTransactionAdvance();
    return {
      message: 'Supplier transactions Advance fetched successfully',
      data: result,
    };
  }

  @Get('/note-credit')
  @Roles('admin')
  @RequirePermissions('read:supplier-transactions-note-credit')
  @ApiOperation({ summary: 'Get all supplier transactions note credit' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier transactions note credit.',
  })
  async getSupplierTransactionNoteCredit() {
    const result = await this.services.getSupplierTransactionNoteCredit();
    return {
      message: 'Supplier transactions note credit fetched successfully',
      data: result,
    };
  }

  @Get('/note-debit')
  @Roles('admin')
  @RequirePermissions('read:supplier-transactions-note-debit')
  @ApiOperation({ summary: 'Get all supplier transactions note debit' })
  @ApiResponse({
    status: 200,
    description: 'Return all supplier transactions note debit.',
  })
  async getSupplierTransactionNoteDebit() {
    const result = await this.services.getSupplierTransactionNoteDebit();
    return {
      message: 'Supplier transactions note debit fetched successfully',
      data: result,
    };
  }

  // endpoint para autorizar upago de un anticipo
  @Patch('/authorize-advance/:id')
  @Roles('admin')
  @RequirePermissions('update:supplier-transactions-advance')
  @ApiOperation({ summary: 'Athorized an supplier transactions advance' })
  @ApiResponse({
    status: 200,
    description: 'Supplier transactions Advance authorized successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier transactions Advance not found.',
  })
  async autorizeAdvancePayment(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.services.autorizeAdvancePayment(userId, +id);
    return {
      message: 'Supplier transactions Advance authorized successfully',
      data,
    };
  }
}
