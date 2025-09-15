import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmPaymentBatchDto } from './dto/confirm-payment-batch.dto';
import { CreatePaymentBatchDto } from './dto/create-payment-batch.dto';
import { FilterPaymentBatchDto } from './dto/filter-payment-batch.dto';
import { PaymentBatchesService } from './payment-batches.service';

@ApiTags('Payment Batches')
@Controller('savings-banks/payment-batches')
export class PaymentBatchesController {
  constructor(private readonly paymentBatchesService: PaymentBatchesService) {}

  @Post()
  async create(@Body() dto: CreatePaymentBatchDto, @Req() req: Request) {
    const userdId = req['user'].id;
    return this.paymentBatchesService.create(dto, userdId);
  }

  @Get()
  async findAll(@Query() dto: FilterPaymentBatchDto) {
    return this.paymentBatchesService.findAll(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentBatchesService.findOne(id);
  }

  @Get(':id/txt')
  async downloadTxt(@Param('id', ParseIntPipe) id: number) {
    const { fileName, content } =
      await this.paymentBatchesService.generateTxtFile(id);
    const buffer = Buffer.from(content, 'utf-8');
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Patch(':id/uploaded')
  @ApiOperation({
    summary: 'Marcar lote como subido al banco (bloquea ediciones)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Lote marcado como UPLOADED' })
  @ApiResponse({ status: 400, description: 'El lote ya no está en borrador' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async markAsUploaded(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userdId = req['user'].id;
    return this.paymentBatchesService.markAsUploaded(id, userdId);
  }

  @Patch(':id/confirm')
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmPaymentBatchDto,
    @Req() req: Request,
  ) {
    const userdId = req['user'].id;
    return await this.paymentBatchesService.confirm(id, dto, userdId);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userdId = req['user'].id;
    await this.paymentBatchesService.cancel(id, userdId);
  }
}
