import { RequirePermissions } from '@/common/decorators/permissions.decorator';
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
import { ApiTags } from '@nestjs/swagger';
import { ConfirmPaymentBatchDto } from './dto/confirm-payment-batch.dto';
import { CreatePaymentBatchDto } from './dto/create-payment-batch.dto';
import { FilterPaymentBatchDto } from './dto/filter-payment-batch.dto';
import { PaymentBatchesService } from './payment-batches.service';

@ApiTags('Payment Batches')
@Controller('savings-banks/payment-batches')
export class PaymentBatchesController {
  constructor(private readonly paymentBatchesService: PaymentBatchesService) {}

  @Post()
  @RequirePermissions('create:payment-batches')
  create(@Body() createPaymentBatchDto: CreatePaymentBatchDto) {
    return this.paymentBatchesService.create(createPaymentBatchDto);
  }

  @Get()
  @RequirePermissions('read:payment-batches')
  findAll(@Query() filters: FilterPaymentBatchDto) {
    return this.paymentBatchesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('read:payment-batches')
  findOne(@Param('id') id: string) {
    return this.paymentBatchesService.findOne(+id);
  }

  @Get(':id/generate-file')
  @RequirePermissions('generate-file:payment-batches')
  generateFile(@Param('id') id: string) {
    // return this.paymentBatchesService.generateTxtFile(+id);
  }

  @Patch(':id/uploaded')
  @RequirePermissions('upload:payment-batches')
  markAsUploaded(@Param('id') id: string) {
    // return this.paymentBatchesService.markAsUploaded(+id);
  }

  @Patch(':id/confirm')
  @RequirePermissions('confirm:payment-batches')
  confirm(
    @Param('id') id: string,
    @Body() confirmPaymentBatchDto: ConfirmPaymentBatchDto,
  ) {
    // return this.paymentBatchesService.confirm(+id, confirmPaymentBatchDto);
  }

  @Patch(':id/cancel')
  @RequirePermissions('cancel:payment-batches')
  cancel(@Param('id') id: string) {
    // return this.paymentBatchesService.cancel(+id);
  }
}
