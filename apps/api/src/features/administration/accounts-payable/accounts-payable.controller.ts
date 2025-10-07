import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
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
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAdvanceSupplierDto } from './dto/create-advance-supplierdto';
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';

@ApiTags('administration/accounts-payable')
@Controller('administration/accounts-payable')
export class AccountsPayableController {
  constructor(private readonly services: AccountsPayableService) {}

  // CONSULTAS LAS CUENTAS POR PAGAR
  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:accounts-payable')
  @ApiOperation({ summary: 'Get all accounts payable' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all accounts payable.' })
  async findAll(@Query() paginationDto: FilterAccountPayableDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Accounts payable fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  //Listar cuentas por pagar para pagos masivos
  @Get('/by-suppliers')
  @Roles('admin')
  @RequirePermissions('read:accounts-payable')
  @ApiOperation({ summary: 'Get all accounts payable by suppliers' })
  @ApiResponse({
    status: 200,
    description: 'Return all accounts payable by suppliers',
  })
  async findBySuppliers(
    @Query('supplierIds', new ParseArrayPipe({ items: Number }))
    supplierIds: number[],
  ) {
    const data =
      await this.services.findAccountsPayableBySuppliers(supplierIds);

    return {
      message: 'Cuentas por pagar obtenidas exitosamente.',
      data: data,
    };
  }

  //endopoint paa listar las transacciones aplicadas a una cuenta por pagar (anticipos, notas credito/debito)
  @Get('/applied-transactions/:id')
  @Roles('admin')
  @RequirePermissions('read:supplier-payment')
  @ApiOperation({ summary: 'Get applied transactions for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return applied transactions.' })
  async getAppliedTransactions(@Param('id') id: string) {
    const result = await this.services.getAppliedTransactions(+id);
    return {
      message: 'Applied transactions fetched successfully',
      data: result,
    };
  }

  //endopoint paa listar segun el anticipo o nota de credito a que cuentas se han aplicado
  @Get('/applied-transaction/:id')
  @Roles('admin')
  @RequirePermissions('read:applied-transaction')
  @ApiOperation({ summary: 'Get applied transactions for an accounts payable' })
  @ApiResponse({ status: 200, description: 'Return applied transactions.' })
  async getAppliedTransaction(@Param('id') id: string) {
    const result = await this.services.getAppliedTransaction(+id);
    return {
      message: 'Applied transactions fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:account-payable')
  @ApiOperation({ summary: 'Get an account payable by ID' })
  @ApiResponse({ status: 200, description: 'Return the account payable.' })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Account payable fetched successfully', data };
  }

  // endpoint para autorizar una cuenta por pagar
  @Patch('/authorize/:id')
  @Roles('admin')
  @RequirePermissions('update:account-payable')
  @ApiOperation({ summary: 'Athorized an account payable' })
  @ApiResponse({
    status: 200,
    description: 'Account payable authorized successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async autorize(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.services.autorize(userId, +id);
    return { message: 'Account payable authorized successfully', data };
  }

  // endpoint para crear un anticipo
  @Post('advance')
  createAdvancePayment(
    @Req() req: Request,
    @Body() createAdvanceSupplierDto: CreateAdvanceSupplierDto,
  ) {
    const userId = req['user'].id;
    return this.services.createAdvanceSupplier(
      createAdvanceSupplierDto,
      userId,
    );
  }

  // endpoint para crear una nota de credito/debito a cuenta por pagar
  @Post('/transaction/credit-debit-note')
  @Roles('admin')
  @RequirePermissions('create:account-payable')
  @ApiOperation({ summary: 'Create a new credit/debit note' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  async createCreditDebitNote(
    @Req() req: Request,
    @Body() dto: CreateSupplierTransactionDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.createCreditDebitNote(userId, dto);
    return { message: 'Transaction created successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:account-payable')
  @ApiOperation({ summary: 'Delete an account payable' })
  @ApiResponse({
    status: 200,
    description: 'Account payable deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Account payable not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
