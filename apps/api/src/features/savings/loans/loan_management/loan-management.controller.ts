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
  CreateLoanDto,
  FilterLoanDto,
  UpdateLoanDto,
} from './dto/loan-management.schema';

@Controller('loan')
export class LoanManagementController {
  constructor(
    private readonly loanManagementService: LoanManagementService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('request')
  @UsePipes(new ZodValidatorPipe(CreateLoanSchema))
  async request(@Req() req: Request, @Body() dto: CreateLoanDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanManagementService.request(targetTenantId, userId, dto);
  }

  @Get()
  @Permissions('read:loan-management')
  @ApiOperation({ summary: 'Get all Loan ordinary or filter by Loan ' })
  @ApiResponse({ status: 200, description: 'Return all Loan.' })
  findAll(@Req() req: Request, @Query() dto: FilterLoanDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findAll(targetTenantId, dto);
  }

  @Get('approved')
  @Permissions('read:loan-management')
  @ApiOperation({ summary: 'Get all Loan approveed ' })
  @ApiResponse({ status: 200, description: 'Return all Loan approveed' })
  findLoanAprovee(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findLoanAprovee(targetTenantId);
  }

  @Get('count')
  @Permissions('read:loan-management-count')
  @ApiOperation({ summary: 'Get all Loan count' })
  @ApiResponse({ status: 200, description: 'Return all Loan count.' })
  findCountAllLoans(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findCountAllLoans(targetTenantId);
  }

  @Get('request/:cedula')
  @Permissions('read:loan-management-requests')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate  not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findOneRequest(cedula, targetTenantId);
  }

  @Get('request/byEdit/:id')
  @Permissions('read:loan-management-edit')
  @ApiOperation({ summary: 'Get one Loan by edit' })
  @ApiResponse({ status: 200, description: 'Return on Loan edit.' })
  @ApiResponse({ status: 404, description: 'Loan edit  not found.' })
  findOneEdit(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findRequestByEdit(id, targetTenantId);
  }

  @Get('by-associate/:associateId')
  @Permissions('read:loans-by-associate')
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

  @Get(':id/details')
  @Permissions('read:loan-management')
  @ApiOperation({ summary: 'Get loan details by ID' })
  @ApiResponse({ status: 200, description: 'Return loan details.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  findLoanDetails(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.findLoanDetails(id, targetTenantId);
  }

  @Patch('approve/:id')
  async approve(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanManagementService.approve(id, targetTenantId, userId);
  }

  @Patch(':id')
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
  @Permissions('delete:loan-management')
  @ApiOperation({ summary: 'Cancel a Loan ' })
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
