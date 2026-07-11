import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
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
import { Request } from 'express';
import { CreditPaidService } from './credit-paid.service';
import {
  CreateCreditPaidDto,
  CreateCreditPaidSchema,
  FilterCreditPaidDto,
  FilterCreditPaidSchema,
} from './dto/credit-paid.schema';

@ApiTags('credit-paid')
@Controller('credit-paid')
export class CrediPaidController {
  constructor(
    private readonly service: CreditPaidService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateCreditPaidSchema))
  create(@Req() req: Request, @Body() dto: CreateCreditPaidDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(targetTenantId, userId, dto);
  }

  @Get('request/:cedula')
  @ApiOperation({ summary: 'Get one credit associate for payment' })
  @ApiResponse({ status: 200, description: 'Return credit associate.' })
  @ApiResponse({ status: 404, description: 'Credit associate not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOneRequest(targetTenantId, cedula);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit payment by ID' })
  @ApiResponse({ status: 200, description: 'Return credit payment.' })
  @ApiResponse({ status: 404, description: 'Credit payment not found.' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(targetTenantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit paid or filter by credit paid' })
  @ApiResponse({ status: 200, description: 'Return all credit paid.' })
  findAll(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(FilterCreditPaidSchema))
    query: FilterCreditPaidDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a credit payment' })
  @ApiResponse({
    status: 200,
    description: 'Credit payment canceled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Credit payment not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.remove(targetTenantId, userId, id);
  }
}
