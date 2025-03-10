import { movementsCountable } from '@/database/schema/accounting';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateMovementCountableDto } from './dto/create-movement-countable.dto';
import { UpdateMovementCountableDto } from './dto/update-movement-countable.dto';

@Injectable()
export class MovementsCountableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createMovementCountableDto: CreateMovementCountableDto) {
    const result = await this.drizzle
      .insert(movementsCountable)
      .values({
        transactionId: BigInt(createMovementCountableDto.transaction_id),
        accountPlanId: createMovementCountableDto.accountPlanId,
        debit: createMovementCountableDto.debit?.toString(),
        havings: createMovementCountableDto.havings?.toString(),
        description: createMovementCountableDto.description,
      })
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(movementsCountable);
  }

  async findAllByTransactionId(transactionId: string) {
    return await this.drizzle
      .select()
      .from(movementsCountable)
      .where(eq(movementsCountable.transactionId, BigInt(transactionId)));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(movementsCountable)
      .where(eq(movementsCountable.id, id));

    if (!result.length) {
      throw new NotFoundException(`Movement with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    id: number,
    updateMovementCountableDto: UpdateMovementCountableDto,
  ) {
    const existingMovement = await this.findOne(id);

    const result = await this.drizzle
      .update(movementsCountable)
      .set({
        transactionId: updateMovementCountableDto.transaction_id
          ? BigInt(updateMovementCountableDto.transaction_id)
          : undefined,
        accountPlanId: updateMovementCountableDto.accountPlanId,
        debit: updateMovementCountableDto.debit?.toString(),
        havings: updateMovementCountableDto.havings?.toString(),
        description: updateMovementCountableDto.description,
      })
      .where(eq(movementsCountable.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingMovement = await this.findOne(id);

    await this.drizzle
      .delete(movementsCountable)
      .where(eq(movementsCountable.id, id));

    return { message: 'Movement deleted successfully' };
  }
}
