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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
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
  ) { }

  @Post()
  async create(@Req() req: Request, @Body(new ZodValidatorPipe(CreatePaymentBatchSchema)) dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.paymentBatchesService.create(targetTenantId, userId, dto);
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(FilterPaymentBatchSchema)) dto: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    return this.paymentBatchesService.findAll(dto, targetTenantId);
  }



  @Patch(':id/uploaded')
  @ApiOperation({
    summary: 'Marcar lote como subido al banco (bloquea ediciones)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Lote marcado como UPLOADED' })
  @ApiResponse({ status: 400, description: 'El lote ya no está en borrador' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async markAsUploaded(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.paymentBatchesService.markAsUploaded(
      id,
      userId,
      targetTenantId,
    );
  }

  @Patch(':id/confirm')
  async confirm(
    @Param('id') id: string,
    @Req() req: Request,
    @Body(new ZodValidatorPipe(ConfirmPaymentBatchSchema)) dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.paymentBatchesService.confirm(
      id,
      dto,
      userId,
      targetTenantId,
    );
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    await this.paymentBatchesService.cancel(id, userId, targetTenantId);
  }

  @Get(':id/txt')
  async downloadTxt(
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const { fileName, content } =
      await this.paymentBatchesService.generateTxtFile(id, targetTenantId);
    res.setHeader('X-Filename', fileName);
    const buffer = Buffer.from(content, 'utf-8');
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${fileName}"`,
    });
  }


  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.paymentBatchesService.findOne(id, targetTenantId);
  }


}
