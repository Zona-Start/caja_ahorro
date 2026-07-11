import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankReconciliationsService } from './bank-reconciliations.service';
import {
  AddReconciliationDetailSchema,
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
