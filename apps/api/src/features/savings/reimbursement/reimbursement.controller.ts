import { Permissions } from '@/common/decorators/permissions.decorator';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateReimbursementSchema,
  FilterReimbursementSchema,
} from './dto/reimbursement.schema';
import { ReimbursementService } from './reimbursement.service';

@ApiTags('Reimbursements')
@Controller('savings-banks/reimbursements')
export class ReimbursementController {
  constructor(
    private readonly service: ReimbursementService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('request/:cedula')
  @Permissions('savings:reimbursement:read')
  @ApiOperation({ summary: 'Saldos a favor pendientes por origen' })
  getExcesses(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.getExcesses(targetTenantId, cedula);
  }

  @Post()
  @Permissions('savings:reimbursement:create')
  @ApiOperation({ summary: 'Registrar solicitud de reintegro' })
  create(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(CreateReimbursementSchema)) dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(targetTenantId, userId, dto);
  }

  @Get()
  @Permissions('savings:reimbursement:read')
  @ApiOperation({ summary: 'Listar reintegros' })
  findAll(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(FilterReimbursementSchema)) filter: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, filter);
  }

  @Get(':id')
  @Permissions('savings:reimbursement:read')
  @ApiOperation({ summary: 'Detalle de un reintegro' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOne(targetTenantId, id);
  }

  @Patch(':id/approve')
  @Permissions('savings:reimbursement:approve')
  @ApiOperation({ summary: 'Aprobar reintegro' })
  approve(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.approve(targetTenantId, userId, id);
  }

  @Patch(':id/process')
  @Permissions('savings:reimbursement:process')
  @ApiOperation({ summary: 'Procesar reintegro a haberes' })
  process(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.process(targetTenantId, userId, id);
  }

  @Patch(':id/disburse')
  @Permissions('savings:reimbursement:disburse')
  @ApiOperation({ summary: 'Desembolsar reintegro en efectivo' })
  disburse(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.disburse(targetTenantId, userId, id, dto);
  }
}
