import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { BankReconciliationsService } from './bank-reconciliations.service';
import {
  AddManualMovementSchema,
  AddReconciliationDetailSchema,
  BulkAddMovementsSchema,
  CreateBankReconciliationSchema,
  FilterBankReconciliationSchema,
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
  @ApiOperation({ summary: 'Create a new bank reconciliation' })
  @ApiResponse({
    status: 201,
    description: 'Reconciliation created successfully.',
  })
  async create(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(dto, userId, targetTenantId);
    return { message: 'Bank Reconciliation created successfully', data };
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload Excel file and create reconciliation with movements' })
  @ApiResponse({
    status: 201,
    description: 'Reconciliation and movements created from Excel.',
  })
  async uploadExcel(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo Excel es requerido');
    }

    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, body);

    const dto = {
      bankAccountId: body.bankAccountId,
      statementDate: new Date(body.statementDate),
      statementEndingBalance: Number(body.statementEndingBalance),
      notes: body.notes || undefined,
    };

    if (!dto.bankAccountId || !dto.statementDate || isNaN(dto.statementEndingBalance)) {
      throw new BadRequestException(
        'bankAccountId, statementDate y statementEndingBalance son requeridos',
      );
    }

    const data = await this.service.uploadExcelAndCreateReconciliation(
      file.buffer,
      dto,
      userId,
      targetTenantId,
    );
    return {
      message: 'Conciliación creada desde Excel exitosamente',
      data,
    };
  }

  @Post(':id/manual-movement')
  @UsePipes(new ZodValidatorPipe(AddManualMovementSchema))
  @ApiOperation({ summary: 'Add a manual movement to reconciliation' })
  async addManualMovement(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.addManualMovement(
      id,
      dto,
      userId,
      targetTenantId,
    );
    return { message: 'Movimiento agregado a la conciliación', data };
  }

  @Post(':id/bulk-movements')
  @ApiOperation({ summary: 'Add multiple existing transactions to reconciliation' })
  async addBulkMovements(
    @Param('id') id: string,
    @Body() body: { movementIds: string[] },
    @Req() req: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.addBulkMovements(
      id,
      body.movementIds,
      targetTenantId,
    );
    return { message: 'Movimientos agregados', data };
  }

  @Get(':id/available-transactions')
  @ApiOperation({ summary: 'Get available transactions for reconciliation' })
  async getAvailableTransactions(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const recon = await this.service.findOne(id, targetTenantId);
    const bankAccountId = (recon as any).bankAccountId;
    const data = await this.service.getAvailableTransactions(
      bankAccountId,
      targetTenantId,
    );
    return { message: 'Available transactions fetched', data };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reconciliation' })
  async cancel(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.cancelReconciliation(id, userId, targetTenantId);
  }

  @Post(':id/details')
  @UsePipes(new ZodValidatorPipe(AddReconciliationDetailSchema))
  @ApiOperation({ summary: 'Add a detail to reconciliation' })
  async addDetail(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.addDetail(id, dto, targetTenantId);
    return { message: 'Detail added successfully', data };
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process and complete reconciliation' })
  async processAndComplete(
    @Param('id') id: string,
    @Req() req: any,
    @Body('tenantId') tenantId?: string,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, tenantId);
    return this.service.processAndComplete(id, userId, targetTenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank reconciliations' })
  @ApiResponse({ status: 200, description: 'Return all reconciliations.' })
  async findAll(
    @Req() req: any,
    @Query('bankAccountId') bankAccountId?: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findAll(
      bankAccountId || undefined,
      targetTenantId,
    );
    return { message: 'Bank Reconciliations fetched successfully', data };
  }

  @Get('/paginated')
  @UsePipes(new ZodValidatorPipe(FilterBankReconciliationSchema))
  @ApiOperation({ summary: 'Get all reconciliations with pagination' })
  async findAllByPagination(@Req() req: any, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(dto, targetTenantId);
    return {
      message: 'Bank Reconciliations fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank reconciliation by ID' })
  @ApiResponse({ status: 200, description: 'Reconciliation found.' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Bank Reconciliation fetched successfully', data };
  }
}
