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
import { Request } from 'express';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  CreateSettlementAssociateSchema,
  DisburseSettlementAssociateSchema,
} from './dto/settlement.schema';
import { SettlementAssociateService } from './settlement-associate.service';

@ApiTags('Settlement Associate')
@Controller('savings-banks/settlement-associate')
export class SettlementAssociateController {
  constructor(
    private readonly service: SettlementAssociateService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('request')
  @UsePipes(new ZodValidatorPipe(CreateSettlementAssociateSchema))
  @ApiOperation({ summary: 'Request an associate settlement' })
  @ApiResponse({
    status: 201,
    description: 'The settlement request has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createRequest(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(targetTenantId, userId, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve and process an associate settlement' })
  @ApiResponse({
    status: 200,
    description: 'The settlement has been successfully processed.',
  })
  @ApiResponse({ status: 404, description: 'Settlement request not found.' })
  approveRequest(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.approve(targetTenantId, userId, id);
  }

  @Post(':id/disburse')
  @UsePipes(new ZodValidatorPipe(DisburseSettlementAssociateSchema))
  @ApiOperation({
    summary: 'Register the final disbursement for a processed settlement',
  })
  @ApiResponse({
    status: 200,
    description: 'The disbursement has been successfully recorded.',
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement request not found or not in PROCESSED status.',
  })
  disburseRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.disburse(targetTenantId, userId, id, dto);
  }

  @Get('approved')
  @ApiOperation({ summary: 'Get all settlement approved' })
  @ApiResponse({ status: 200, description: 'Return all settlement approved' })
  findSettlementAprovee(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findSettlementAprovee(targetTenantId, paginationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all settlements or filter by settlement associate',
  })
  @ApiResponse({ status: 200, description: 'Return all settlements.' })
  findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, paginationDto);
  }

  @Get('request/:cedula')
  @ApiOperation({ summary: 'Get one settlement associate' })
  @ApiResponse({ status: 200, description: 'Return one settlement associate.' })
  @ApiResponse({ status: 404, description: 'Settlement associate not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOneRequest(targetTenantId, cedula);
  }
}
