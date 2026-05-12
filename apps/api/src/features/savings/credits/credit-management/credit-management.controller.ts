import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Request } from 'express';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  CreateCreditSchema,
  FilterCreditSchema,
  CreateCreditDto,
  FilterCreditDto,
} from './dto/credit.schema';
import { CreditManagementService } from './credit-management.service';

@ApiTags('credit')
@Controller('credit')
export class CreditManagementController {
  constructor(
    private readonly service: CreditManagementService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('request')
  @UsePipes(new ZodValidatorPipe(CreateCreditSchema))
  async request(@Req() req: Request, @Body() dto: CreateCreditDto) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.service.request(targetTenantId, userId, dto);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get all credit count' })
  @ApiResponse({ status: 200, description: 'Return all credit count.' })
  findCountAllCredits(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findCountAllCredits(targetTenantId);
  }

  @Get('request/byEdit/:id')
  @ApiOperation({ summary: 'Get one credit by edit' })
  @ApiResponse({ status: 200, description: 'Return on credit edit.' })
  @ApiResponse({ status: 404, description: 'credit edit not found.' })
  findOneEdit(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findRequestByEdit(targetTenantId, id);
  }

  @Get('request/:cedula')
  @ApiOperation({ summary: 'Get one credit associate' })
  @ApiResponse({ status: 200, description: 'Return on credit associate.' })
  @ApiResponse({ status: 404, description: 'credit Associate not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOneRequest(targetTenantId, cedula);
  }

  @Get('by-associate/:associateId')
  @ApiOperation({ summary: 'Get all credits for a specific associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all credits for the associate.',
  })
  async findAllByAssociate(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() filtersDto: PaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAllByAssociate(targetTenantId, associateId, filtersDto);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get credit details by ID' })
  @ApiResponse({ status: 200, description: 'Return credit details.' })
  @ApiResponse({ status: 404, description: 'Credit not found.' })
  findCreditDetails(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findCreditDetails(targetTenantId, id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(targetTenantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit ordinary or filter by credit' })
  @ApiResponse({ status: 200, description: 'Return all Loan.' })
  findAll(@Req() req: Request, @Query(new ZodValidatorPipe(FilterCreditSchema)) query: FilterCreditDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, query);
  }

  @Post('approve/:id')
  async approve(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.approve(targetTenantId, userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an credit' })
  @ApiResponse({
    status: 200,
    description: 'credit deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'credit not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.service.remove(targetTenantId, userId, id);
  }
}
