import { Permissions } from '@/common/decorators/permissions.decorator';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
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
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { LoanManagementService } from './loan-management.service';
import {
  CreateLoanSchema,
  FilterLoanSchema,
  UpdateLoanSchema,
  SearchAssociateSchema,
  CalculateAmortizationSchema,
  DisburseLoanSchema,
  CreateLoanDto,
  FilterLoanDto,
  UpdateLoanDto,
  DisburseLoanDto,
} from './dto/loan-management.schema';

@Controller('loan')
export class LoanManagementController {
  constructor(
    private readonly loanManagementService: LoanManagementService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post('request')
  @Permissions('portfolio:loans:create')
  @UsePipes(new ZodValidatorPipe(CreateLoanSchema))
  async request(@Req() req: Request, @Body() dto: CreateLoanDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanManagementService.request(targetTenantId, userId, dto);
  }

  @Get('search-associate/:cedula')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Search associate by cedula for loan request' })
  async searchAssociate(
    @Req() req: Request,
    @Param('cedula') cedula: string,
  ) {
    const { targetTenantId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.searchAssociate(targetTenantId, cedula);
  }

  @Get('calculate-amortization')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Calculate French amortization schedule preview' })
  async calculateAmortization(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(CalculateAmortizationSchema))
    query: any,
  ) {
    return this.loanManagementService.calculateAmortization({
      amount: query.amount,
      annualRate: query.annualRate,
      paymentCount: query.paymentCount,
      startDate: query.startDate,
      paymentType: query.paymentType,
      expensesPercentage: query.expensesPercentage,
    });
  }



  @Get()
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get all Loan ordinary or filter by Loan' })
  @ApiResponse({ status: 200, description: 'Return all Loan.' })
  findAll(@Req() req: Request, @Query() dto: FilterLoanDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findAll(targetTenantId, dto);
  }

  @Get('approved')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get all Loan approved' })
  @ApiResponse({ status: 200, description: 'Return all Loan approved' })
  findLoanAprovee(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findLoanAprovee(targetTenantId);
  }

  @Get('count')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get all Loan count' })
  @ApiResponse({ status: 200, description: 'Return all Loan count.' })
  findCountAllLoans(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findCountAllLoans(targetTenantId);
  }

  @Get('request/:cedula')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findOneRequest(cedula, targetTenantId);
  }

  @Get('request/byEdit/:id')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get one Loan by edit' })
  @ApiResponse({ status: 200, description: 'Return on Loan edit.' })
  @ApiResponse({ status: 404, description: 'Loan edit not found.' })
  findOneEdit(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findRequestByEdit(id, targetTenantId);
  }

  @Get('by-associate/:associateId')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get all loans for a specific associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all loans for the associate.',
  })
  async findAllByAssociate(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() filtersDto: FilterLoanDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.loanManagementService.findAllByAssociate(
      associateId,
      targetTenantId,
      filtersDto,
    );
    return {
      message: 'loans fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
  }



  @Patch('approve/:id')
  @Permissions('portfolio:loans:approve')
  async approve(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.approve(targetTenantId, userId, id);
  }

  @Post('disburse/:id')
  @Permissions('portfolio:loans:process')
  async disburse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidatorPipe(DisburseLoanSchema)) dto: DisburseLoanDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.disburse(targetTenantId, userId, id, dto);
  }

  @Get(':id/details')
  @Permissions('portfolio:loans:read')
  @ApiOperation({ summary: 'Get loan details by ID' })
  @ApiResponse({ status: 200, description: 'Return loan details.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  findLoanDetails(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findLoanDetails(id, targetTenantId);
  }

  @Get(':id')
  @Permissions('portfolio:loans:read')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findOne(targetTenantId, id);
  }

  @Patch(':id')
  @Permissions('portfolio:loans:update')
  @UsePipes(new ZodValidatorPipe(UpdateLoanSchema))
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanManagementService.update(
      id,
      targetTenantId,
      userId,
      dto,
    );
  }

  @Delete(':id')
  @Permissions('portfolio:loans:reject')
  @ApiOperation({ summary: 'Cancel a Loan' })
  @ApiResponse({
    status: 200,
    description: 'Loan cancelled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.remove(id, targetTenantId, userId);
  }
}
