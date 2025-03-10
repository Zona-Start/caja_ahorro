import { transactionsCountable } from '@/database/schema/accounting';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateTransactionCountableDto } from './dto/create-transaction-countable.dto';
import { UpdateTransactionCountableDto } from './dto/update-transaction-countable.dto';

@Injectable()
export class TransactionsCountableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createTransactionCountableDto: CreateTransactionCountableDto) {
    // Convert Date object to ISO string format for database compatibility
    const transactionData = {
      ...createTransactionCountableDto,
      date: createTransactionCountableDto.date.toISOString(),
    };

    const result = await this.drizzle
      .insert(transactionsCountable)
      .values(transactionData)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(transactionsCountable);
  }

  async findAllBySavingsBank(savingsBankId: number) {
    return await this.drizzle
      .select()
      .from(transactionsCountable)
      .where(eq(transactionsCountable.savingsBankId, savingsBankId));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(transactionsCountable)
      .where(eq(transactionsCountable.id, id));

    if (!result.length) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    id: number,
    updateTransactionCountableDto: UpdateTransactionCountableDto,
  ) {
    const existingTransaction = await this.findOne(id);

    // Convert Date to ISO string if date is present in the DTO
    const updateData = {
      ...updateTransactionCountableDto,
      date: updateTransactionCountableDto.date
        ? updateTransactionCountableDto.date.toISOString()
        : undefined,
    };

    const result = await this.drizzle
      .update(transactionsCountable)
      .set(updateData)
      .where(eq(transactionsCountable.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingTransaction = await this.findOne(id);

    await this.drizzle
      .delete(transactionsCountable)
      .where(eq(transactionsCountable.id, id));

    return { message: 'Transaction deleted successfully' };
  }
}
