import { PartialType } from '@nestjs/swagger';
import { CreatePaymentBatchDto } from './create-payment-batch.dto';

export class UpdatePaymentBatchDto extends PartialType(CreatePaymentBatchDto) {}
