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
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  CreateWithdrawalAssociateSchema,
  DisburseWithdrawalAssociateSchema,
  FilterWithdrawalAssociateSchema,
} from './dto/withdrawal.schema';
import { WithdrawalAssociateService } from './withdrawal-associate.service';

@Controller('savings-banks/withdrawal-associate')
export class WithdrawalAssociateController {
  constructor(
    private readonly service: WithdrawalAssociateService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateWithdrawalAssociateSchema))
  @ApiOperation({ summary: 'Execute a new withdrawal request' })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created successfully.',
  })
  execute(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.execute(targetTenantId, userId, dto);
  }

  @Get('approved')
  @UsePipes(new ZodValidatorPipe(FilterWithdrawalAssociateSchema))
  @ApiOperation({ summary: 'Get all withdrawal approved' })
  @ApiResponse({ status: 200, description: 'Return all withdrawal approved' })
  findWithdrawalAprovee(@Req() req: Request, @Query() paginationDto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findWithdrawalAprovee(targetTenantId, paginationDto);
  }

  @Get()
  @UsePipes(new ZodValidatorPipe(FilterWithdrawalAssociateSchema))
  @ApiOperation({
    summary: 'Get all withdrawals or filter by withdrawal associate',
  })
  @ApiResponse({ status: 200, description: 'Return all withdrawals.' })
  findAll(@Req() req: Request, @Query() paginationDto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, paginationDto);
  }

  @Get('request/:cedula')
  @ApiOperation({ summary: 'Get one withdrawal associate' })
  @ApiResponse({ status: 200, description: 'Return one withdrawal associate.' })
  @ApiResponse({ status: 404, description: 'Withdrawal associate not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOneRequest(targetTenantId, cedula);
  }

  @Get('by-associate/:associateId')
  @ApiOperation({ summary: 'Get all withdrawals for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all withdrawals for the associate.',
  })
  async findAllByAssociate(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() filtersDto: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAllByAssociate(targetTenantId, associateId, filtersDto);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get withdrawal details by ID' })
  @ApiResponse({ status: 200, description: 'Return withdrawal details.' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  findWithdrawalDetails(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findWithdrawalDetails(targetTenantId, id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal approved/disbursed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  approve(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.approve(targetTenantId, userId, id);
  }

  @Patch(':id/disburse')
  @UsePipes(new ZodValidatorPipe(DisburseWithdrawalAssociateSchema))
  @ApiOperation({ summary: 'Disburse an approved withdrawal request' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal disbursed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  disburse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.disburse(targetTenantId, userId, id, dto);
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Process an approved withdrawal request' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal processed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  process(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.process(targetTenantId, userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel or reverse a Withdrawal' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal canceled/reversed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.remove(targetTenantId, userId, id);
  }
}
