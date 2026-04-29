import { ReqLogInterceptor } from '@/common/interceptors';
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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccountingEntriesService } from './accounting-entries.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { FilterAccountingEntryDto } from './dto/filter-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

@ApiTags('accounting/entries')
@UseInterceptors(ReqLogInterceptor)
@Controller('accounting/entries')
export class AccountingEntriesController {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new accounting entry (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Accounting entry created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateAccountingEntryDto) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountingEntriesService.create(
      userId,
      targetTenantId,
      dto,
    );
    return { message: 'Accounting entry created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounting entries' })
  async findAllPaginated(
    @Req() req: Request,
    @Query() dto: FilterAccountingEntryDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req, dto);
    const result = await this.accountingEntriesService.findAllPaginated(
      targetTenantId,
      dto,
    );
    return {
      message: 'Accounting entries fetched',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an accounting entry by ID' })
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountingEntriesService.findOne(
      targetTenantId,
      id,
    );
    return { message: 'Accounting entry fetched', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an accounting entry' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAccountingEntryDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountingEntriesService.update(
      userId,
      targetTenantId,
      id,
      dto,
    );
    return { message: 'Accounting entry updated', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an accounting entry' })
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      tenantId,
    );
    return await this.accountingEntriesService.remove(
      userId,
      targetTenantId,
      id,
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an accounting entry (DRAFT -> PENDING)' })
  async submit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountingEntriesService.submitEntry(
      userId,
      targetTenantId,
      id,
    );
    return { message: 'Accounting entry submitted successfully', data };
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post an accounting entry (PENDING -> POSTED)' })
  async post(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountingEntriesService.postEntry(
      userId,
      targetTenantId,
      id,
    );
    return { message: 'Accounting entry posted successfully', data };
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary:
      'Cancel an accounting entry (POSTED -> CANCELLED) and create reversal.',
  })
  async cancel(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() tenantId?: string,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      tenantId,
    );
    const data = await this.accountingEntriesService.cancelEntry(
      userId,
      targetTenantId,
      id,
    );
    return {
      message: 'Accounting entry cancelled and reversed successfully',
      data,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar cuadre de un asiento sin guardar' })
  async validateEntry(
    @Req() req: Request,
    @Body() dto: CreateAccountingEntryDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req, dto);
    const data = await this.accountingEntriesService.validateDto(
      targetTenantId,
      dto,
    );
    return { message: 'Entry validation successful', data };
  }

  // @Get('totals')
  // @ApiOperation({ summary: 'Total general debe/haber entre fechas' })
  // async getTotals(
  //   @Req() req: Request,
  //   @Query('start') start: string,
  //   @Query('end') end: string,
  //   @Body() tenantId?: string,
  // ) {
  //   const { targetTenantId } = this.tenantContext.getTenantContext(
  //     req,
  //     tenantId,
  //   );
  //   const data = await this.accountingEntriesService.getTotals(
  //     targetTenantId,
  //     new Date(start),
  //     new Date(end),
  //   );
  //   return { message: 'Totals fetched successfully', data };
  // }

  // @Post('generate-opening')
  // @ApiOperation({ summary: 'Generar asiento de apertura de ciclo' })
  // async generateOpening(@Req() req: Request, @Body() dto: GenerateOpeningDto) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.generateOpening(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return { message: 'Opening entry generated successfully', data };
  // }

  // @Post('close-month')
  // @ApiOperation({
  //   summary: 'Cierre de resultado (ingresos/gastos → patrimonio)',
  // })
  // async closeMonth(@Req() req: Request, @Body() dto: CloseMonthDto) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.closeMonth(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return { message: 'Month closing entry generated successfully', data };
  // }

  // @Post('depreciation')
  // @ApiOperation({ summary: 'Generar asiento de depreciación mensual' })
  // async depreciation(@Req() req: Request, @Body() dto: DepreciationDto) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.depreciate(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return { message: 'Depreciation entry generated successfully', data };
  // }

  // @Post('bank-reconciliation')
  // @ApiOperation({
  //   summary: 'Generar asientos de ajuste por conciliación bancaria',
  // })
  // async bankReconciliation(
  //   @Req() req: Request,
  //   @Body() dto: BankReconciliationDto,
  // ) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.bankReconciliation(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return {
  //     message: 'Bank reconciliation entries generated successfully',
  //     data,
  //   };
  // }

  // @Post('inventory-adjust')
  // @ApiOperation({ summary: 'Generar asientos de ajuste de inventario' })
  // async inventoryAdjust(@Req() req: Request, @Body() dto: InventoryAdjustDto) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.inventoryAdjust(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return {
  //     message: 'Inventory adjustment entries generated successfully',
  //     data,
  //   };
  // }

  // @Post('tax-provision')
  // @ApiOperation({ summary: 'Generar asiento de provisión de impuestos' })
  // async taxProvision(@Req() req: Request, @Body() dto: TaxProvisionDto) {
  //   const { targetTenantId, userId } = this.tenantContext.getTenantContext(
  //     req,
  //     dto,
  //   );
  //   const data = await this.accountingEntriesService.taxProvision(
  //     userId,
  //     targetTenantId,
  //     dto,
  //   );
  //   return { message: 'Tax provision entry generated successfully', data };
  // }
}
