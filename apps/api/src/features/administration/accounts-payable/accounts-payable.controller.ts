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

  // @Post()
  // @Roles('admin')
  // @RequirePermissions('create:account-payable')
  // @ApiOperation({ summary: 'Create a new account payable' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Account payable created successfully.',
  // })
  // async create(@Req() req: Request, @Body() dto: CreateAccountPayableDto) {
  //   const userId = req['user'].id;
  //   const data = await this.services.create(userId, dto);
  //   return { message: 'Account payable created successfully', data };
  // }

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

  // @Get('/report/:id')
  // @Roles('admin')
  // @RequirePermissions('read:account-payable')
  // @ApiOperation({ summary: 'Generate PDF report for an account payable' })
  // @ApiResponse({ status: 200, description: 'PDF report generated successfully.' })
  // @Header('Content-Type', 'application/pdf')
  // @Header('Content-Disposition', 'attachment; filename=account-payable-report.pdf')
  // async generateReport(@Param('id') id: string) {
  //   const pdfBuffer = await this.services.generateAccountPayableReport(+id);
  //   return new StreamableFile(pdfBuffer);
  // }

  //VERFICIAR SI HACE FALTA SI NO ELIMINAR
  // @Get(':id/preloaded-payment')
  // @Roles('admin')
  // @RequirePermissions('read:account-payable') // O el permiso que corresponda
  // @ApiOperation({
  //   summary: 'Get preloaded payment data for an account payable',
  // })
  // @ApiResponse({ status: 200, description: 'Return preloaded payment data.' })
  // async getPreloadedPaymentData(@Param('id') id: string) {
  //   const data = await this.services.getPreloadedPaymentData(+id);
  //   return { message: 'Preloaded data fetched successfully', data };
  // }

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

  // @Patch(':id')
  // @Roles('admin')
  // @RequirePermissions('update:account-payable')
  // @ApiOperation({ summary: 'Update an account payable' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Account payable updated successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'Account payable not found.' })
  // async update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() dto: UpdateAccountPayableDto,
  // ) {
  //   const userId = req['user'].id;
  //   const data = await this.services.update(userId, +id, dto);
  //   return { message: 'Account payable updated successfully', data };
  // }

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
