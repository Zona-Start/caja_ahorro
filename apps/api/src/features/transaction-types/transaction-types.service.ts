import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { transaction_types } from '@/database/index';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionType } from './entities/transaction-type.entity';

@Injectable()
export class TransactionTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<TransactionType[]> {
    return await this.drizzle.select().from(transaction_types);
  }

  async findOne(id: number): Promise<TransactionType> {
    const transactionType = await this.drizzle
      .select()
      .from(transaction_types)
      .where(eq(transaction_types.id, id));

    if (transactionType.length === 0) {
      throw new HttpException(
        'Transaction type not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return transactionType[0];
  }

  async create(
    createTransactionTypeDto: CreateTransactionTypeDto,
  ): Promise<TransactionType> {
    const [transactionType] = await this.drizzle
      .insert(transaction_types)
      .values({
        name: createTransactionTypeDto.name,
        description: createTransactionTypeDto.description,
      })
      .returning();

    return transactionType;
  }

  async update(
    id: number,
    updateTransactionTypeDto: UpdateTransactionTypeDto,
  ): Promise<TransactionType> {
    // Check if transaction type exists
    await this.findOne(id);

    await this.drizzle
      .update(transaction_types)
      .set({
        name: updateTransactionTypeDto.name,
        description: updateTransactionTypeDto.description,
      })
      .where(eq(transaction_types.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if transaction type exists
    await this.findOne(id);

    await this.drizzle
      .delete(transaction_types)
      .where(eq(transaction_types.id, id));

    return { message: 'Transaction type deleted successfully' };
  }
}
