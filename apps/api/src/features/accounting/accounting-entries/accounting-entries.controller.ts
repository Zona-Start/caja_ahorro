import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingEntriesService } from './accounting-entries.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import {
  BankReconciliationDto,
  CloseMonthDto,
  DepreciationDto,
  GenerateOpeningDto,
  InventoryAdjustDto,
  TaxProvisionDto,
} from './dto/extras.dto';
import { FilterAccountingEntryDto } from './dto/filter-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

@ApiTags('accounting-entries')
@Controller('accounting-entries')
export class AccountingEntriesController {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Create a new accounting entry (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Accounting entry created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createAccountingEntryDto: CreateAccountingEntryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.create(
      userId,
      createAccountingEntryDto,
    );
    return { message: 'Accounting entry created successfully', data };
  }

  @Get()
  @RequirePermissions('read:accounting-entries')
  @ApiOperation({
    summary: 'Get all accounting entries with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated accounting entries.',
  })
  async findAllPaginated(
    @Query() filterAccountingEntryDto: FilterAccountingEntryDto,
  ) {
    const result = await this.accountingEntriesService.findAllPaginated(
      filterAccountingEntryDto,
    );
    return {
      message: 'Accounting entries fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:accounting-entry')
  @ApiOperation({ summary: 'Get an accounting entry by ID' })
  @ApiResponse({ status: 200, description: 'Return the accounting entry.' })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.accountingEntriesService.findOne(+id);
    return { message: 'Accounting entry fetched successfully', data };
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('update:accounting-entry')
  @ApiOperation({ summary: 'Update an accounting entry (only if DRAFT)' })
  @ApiResponse({
    status: 200,
    description: 'Accounting entry updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Entry not in DRAFT status.',
  })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAccountingEntryDto: UpdateAccountingEntryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.update(
      userId,
      +id,
      updateAccountingEntryDto,
    );
    return { message: 'Accounting entry updated successfully', data };
  }

  @Delete(':id')
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('delete:accounting-entry')
  @ApiOperation({ summary: 'Delete an accounting entry (only if DRAFT)' })
  @ApiResponse({
    status: 200,
    description: 'Accounting entry deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Entry not in DRAFT status.',
  })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async remove(@Param('id') id: string) {
    return await this.accountingEntriesService.remove(+id);
  }

  @Post(':id/submit')
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('submit:accounting-entry')
  @ApiOperation({ summary: 'Submit an accounting entry (DRAFT -> PENDING)' })
  @ApiResponse({
    status: 200,
    description: 'Accounting entry submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Entry not in DRAFT status or validation failed.',
  })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async submit(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.submitEntry(userId, +id);
    return { message: 'Accounting entry submitted successfully', data };
  }

  @Post(':id/post')
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('post:accounting-entry')
  @ApiOperation({ summary: 'Post an accounting entry (PENDING -> POSTED)' })
  @ApiResponse({
    status: 200,
    description: 'Accounting entry posted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Entry not in PENDING status.',
  })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async post(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.postEntry(userId, +id);
    return { message: 'Accounting entry posted successfully', data };
  }

  @Post(':id/cancel')
  @Roles('superadmin', 'admin', 'contable')
  @RequirePermissions('cancel:accounting-entry')
  @ApiOperation({
    summary:
      'Cancel an accounting entry (POSTED -> CANCELLED) and create reversal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accounting entry cancelled and reversed successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Entry not in POSTED status.',
  })
  @ApiResponse({ status: 404, description: 'Accounting entry not found.' })
  async cancel(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.cancelEntry(userId, +id);
    return {
      message: 'Accounting entry cancelled and reversed successfully',
      data,
    };
  }

  /* ---------- UTILIDADES & CONSULTAS ---------- */


  /* 2. Validar cuadre sin guardar */
  @Post('validate')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Validar cuadre de un asiento sin guardar' })
  @ApiResponse({ status: 200, description: 'Preview de cuadre.' })
  async validateEntry(@Body() dto: CreateAccountingEntryDto) {
    const data = await this.accountingEntriesService.validateDto(dto);
    return { message: 'Entry validation successful', data };
  }

  /* 3. Totales debe/haber entre fechas */
  @Get('totals')
  @RequirePermissions('read:accounting-entries')
  @ApiOperation({ summary: 'Total general debe/haber entre fechas' })
  @ApiResponse({ status: 200, description: 'Totales por rango.' })
  async getTotals(
    @Query('companyId') companyId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const data = await this.accountingEntriesService.getTotals(
      +companyId,
      new Date(start),
      new Date(end),
    );
    return { message: 'Totals fetched successfully', data };
  }

  /* 4. Asiento de apertura */
  @Post('generate-opening')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Generar asiento de apertura de ciclo' })
  @ApiResponse({ status: 201, description: 'Asiento de apertura creado.' })
  async generateOpening(
    @Body() dto: GenerateOpeningDto, // { accountingCycleId, entryDate, balances[] }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.generateOpening(
      userId,
      dto,
    );
    return { message: 'Opening entry generated successfully', data };
  }

  /* 5. Cierre de resultado del mes */
  @Post('close-month')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({
    summary: 'Cierre de resultado (ingresos/gastos → patrimonio)',
  })
  @ApiResponse({ status: 201, description: 'Asiento de cierre creado.' })
  async closeMonth(
    @Body() dto: CloseMonthDto, // { accountingCycleId, entryDate, resultAccountId }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.closeMonth(userId, dto);
    return { message: 'Month closing entry generated successfully', data };
  }

  /* 6. Depreciación de activos fijos */
  @Post('depreciation')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Generar asiento de depreciación mensual' })
  @ApiResponse({ status: 201, description: 'Depreciation entry created.' })
  async depreciation(
    @Body() dto: DepreciationDto, // { accountingCycleId, entryDate, lines[] }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.depreciate(userId, dto);
    return { message: 'Depreciation entry generated successfully', data };
  }

  /* 8. Ajustes por conciliación bancaria */
  @Post('bank-reconciliation')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({
    summary: 'Generar asientos de ajuste por conciliación bancaria',
  })
  @ApiResponse({
    status: 201,
    description: 'Bank reconciliation entries created.',
  })
  async bankReconciliation(
    @Body() dto: BankReconciliationDto, // { accountingCycleId, entryDate, items[] }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.bankReconciliation(
      userId,
      dto,
    );
    return {
      message: 'Bank reconciliation entries generated successfully',
      data,
    };
  }

  /* 9. Ajustes de inventario (mermas / sobrantes) */
  @Post('inventory-adjust')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Generar asientos de ajuste de inventario' })
  @ApiResponse({
    status: 201,
    description: 'Inventory adjustment entries created.',
  })
  async inventoryAdjust(
    @Body() dto: InventoryAdjustDto, // { accountingCycleId, entryDate, items[] }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.inventoryAdjust(
      userId,
      dto,
    );
    return {
      message: 'Inventory adjustment entries generated successfully',
      data,
    };
  }

  /* 10. Provisiones de impuestos */
  @Post('tax-provision')
  @RequirePermissions('create:accounting-entry')
  @ApiOperation({ summary: 'Generar asiento de provisión de impuestos' })
  @ApiResponse({ status: 201, description: 'Tax provision entry created.' })
  async taxProvision(
    @Body() dto: TaxProvisionDto, // { accountingCycleId, entryDate, items[] }
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    const data = await this.accountingEntriesService.taxProvision(userId, dto);
    return { message: 'Tax provision entry generated successfully', data };
  }
}
