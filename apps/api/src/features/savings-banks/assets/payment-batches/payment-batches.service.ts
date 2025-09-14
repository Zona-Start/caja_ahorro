
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  paymentBatches,
  paymentBatchItems,
} from '@/database/schema/savings-banks';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreatePaymentBatchDto } from './dto/create-payment-batch.dto';
import { UpdatePaymentBatchDto } from './dto/update-payment-batch.dto';

@Injectable()
export class PaymentBatchesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}
  create(createPaymentBatchDto: CreatePaymentBatchDto) {
    return 'This action adds a new paymentBatch';
  }

  findAll() {
    return `This action returns all paymentBatches`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentBatch`;
  }

  update(id: number, updatePaymentBatchDto: UpdatePaymentBatchDto) {
    return `This action updates a #${id} paymentBatch`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentBatch`;
  }
}
