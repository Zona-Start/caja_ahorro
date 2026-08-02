import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { BankReconciliationsService } from './bank-reconciliations.service';
import {
  AddStatementLineSchema,
  CreateBankReconciliationSchema,
  FilterBankReconciliationSchema,
  GenerateBookEntrySchema,
  ManualMatchSchema,
} from './dto/bank-reconciliations.schema';

@ApiTags('bakings/bank-reconciliations')
@Controller('bakings/bank-reconciliations')
export class BankReconciliationsController {
  constructor(
    private readonly service: BankReconciliationsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateBankReconciliationSchema))
  @ApiOperation({ summary: 'Create reconciliation with date range' })
  async create(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(dto, userId, targetTenantId);
    return { message: 'Conciliación creada', data };
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload Excel and create reconciliation with statement lines' })
  async uploadExcel(@Req() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) throw new BadRequestException('El archivo Excel es requerido');
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, body);
    const dto = {
      bankAccountId: body.bankAccountId,
      startDate: new Date(body.startDate || body.statementDate),
      statementDate: new Date(body.statementDate),
      statementEndingBalance: Number(body.statementEndingBalance),
      notes: body.notes || undefined,
    };
    if (!dto.bankAccountId || isNaN(dto.statementEndingBalance)) {
      throw new BadRequestException('bankAccountId, statementDate y statementEndingBalance son requeridos');
    }
    const data = await this.service.uploadExcelAndCreateReconciliation(file.buffer, dto, userId, targetTenantId);
    return { message: 'Conciliación creada desde Excel', data };
  }

  @Post(':id/statement-line')
  @ApiOperation({ summary: 'Add statement line (stores in bank_statement_lines only)' })
  async addStatementLine(@Param('id') id: string, @Body(new ZodValidatorPipe(AddStatementLineSchema)) dto: any, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.addStatementLine(id, dto, targetTenantId);
    return { message: 'Línea de extracto agregada', data };
  }

  @Get(':id/statement-lines')
  @ApiOperation({ summary: 'Get statement lines for reconciliation' })
  async getStatementLines(@Param('id') id: string, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.getStatementLines(id, targetTenantId);
    return { message: 'Líneas de extracto obtenidas', data };
  }

  @Get(':id/book-transactions')
  @ApiOperation({ summary: 'Get bank transactions (book entries) available for matching' })
  async getBookTransactions(@Param('id') id: string, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.getBookTransactions(id, targetTenantId);
    return { message: 'Movimientos de libros obtenidos', data };
  }

  @Post(':id/auto-match')
  @ApiOperation({ summary: 'Auto-match statement lines against book transactions' })
  async autoMatch(@Param('id') id: string, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.autoMatch(id, targetTenantId);
  }

  @Post(':id/manual-match')
  @UsePipes(new ZodValidatorPipe(ManualMatchSchema))
  @ApiOperation({ summary: 'Manual match: 1:1, 1:N, N:1 with amount validation' })
  async manualMatch(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.manualMatch(id, dto, targetTenantId);
  }

  @Post(':id/generate-book-entry')
  @ApiOperation({ summary: 'Create bank transaction from statement line and auto-match' })
  async generateBookEntry(@Param('id') id: string, @Body(new ZodValidatorPipe(GenerateBookEntrySchema)) dto: any, @Req() req: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.generateBookEntry(id, dto, userId, targetTenantId);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process and complete reconciliation' })
  async processAndComplete(@Param('id') id: string, @Req() req: any, @Body('tenantId') tenantId?: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, tenantId);
    return this.service.processAndComplete(id, userId, targetTenantId);
  }

  @Post(':id/unmatch-line/:lineId')
  @ApiOperation({ summary: 'Unmatch and delete a statement line' })
  async unmatchStatementLine(@Param('id') id: string, @Param('lineId') lineId: string, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.unmatchStatementLine(id, lineId, targetTenantId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reconciliation' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.cancelReconciliation(id, userId, targetTenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank reconciliations, optionally filtered by bankAccountId' })
  async findAll(@Req() req: any, @Query('bankAccountId') bankAccountId?: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(bankAccountId || undefined, targetTenantId);
    return { message: 'Bank Reconciliations fetched successfully', data };
  }

  @Get('/paginated')
  @UsePipes(new ZodValidatorPipe(FilterBankReconciliationSchema))
  @ApiOperation({ summary: 'Get reconciliations with pagination' })
  async findAllByPagination(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, dto);
    const result = await this.service.findAllByPagination(dto, targetTenantId);
    return { message: 'Conciliaciones obtenidas', data: result.data, meta: result.meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reconciliation by ID with statement lines and details' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Conciliación obtenida', data };
  }
}
