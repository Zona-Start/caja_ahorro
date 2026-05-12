import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  ConfirmPaymentBatchSchema,
  CreatePaymentBatchSchema,
  FilterPaymentBatchSchema,
} from './dto/payment-batches.schema';
import { PaymentBatchesService } from './payment-batches.service';

@ApiTags('Payment Batches')
@Controller('savings-banks/payment-batches')
export class PaymentBatchesController {
  constructor(
    private readonly paymentBatchesService: PaymentBatchesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @UsePipes(new ZodValidatorPipe(CreatePaymentBatchSchema))
  async create(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req, dto);
    return this.paymentBatchesService.create(targetTenantId, userId, dto);
  }

  @Get()
  @UsePipes(new ZodValidatorPipe(FilterPaymentBatchSchema))
  async findAll(@Req() req: Request, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, dto);
    return this.paymentBatchesService.findAll(dto, targetTenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.paymentBatchesService.findOne(id, targetTenantId);
  }

  @Get(':id/txt')
  async downloadTxt(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const { fileName, content } =
      await this.paymentBatchesService.generateTxtFile(id, targetTenantId);
    const buffer = Buffer.from(content, 'utf-8');
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Patch(':id/uploaded')
  @ApiOperation({
    summary: 'Marcar lote como subido al banco (bloquea ediciones)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Lote marcado como UPLOADED' })
  @ApiResponse({ status: 400, description: 'El lote ya no está en borrador' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async markAsUploaded(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return this.paymentBatchesService.markAsUploaded(id, userId, targetTenantId);
  }

  @Patch(':id/confirm')
  @UsePipes(new ZodValidatorPipe(ConfirmPaymentBatchSchema))
  async confirm(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: any,
  ) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    return await this.paymentBatchesService.confirm(id, dto, userId, targetTenantId);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId, userId } = this.tenantContextService.getTenantContext(req);
    await this.paymentBatchesService.cancel(id, userId, targetTenantId);
  }
}
