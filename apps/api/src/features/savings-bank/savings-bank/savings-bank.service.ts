import { savingsBank } from '@/database/schema/box';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateSavingsBankDto } from './dto/create-savings-bank.dto';
import { UpdateSavingsBankDto } from './dto/update-savings-bank.dto';

@Injectable()
export class SavingsBankService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createSavingsBankDto: CreateSavingsBankDto) {
    const result = await this.drizzle
      .insert(savingsBank)
      .values(createSavingsBankDto)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(savingsBank);
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(savingsBank)
      .where(eq(savingsBank.id, id));

    if (!result.length) {
      throw new NotFoundException(`Savings bank with ID ${id} not found`);
    }

    return result[0];
  }

  async update(id: number, updateSavingsBankDto: UpdateSavingsBankDto) {
    const existingBank = await this.findOne(id);

    const result = await this.drizzle
      .update(savingsBank)
      .set({
        ...updateSavingsBankDto,
      })
      .where(eq(savingsBank.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingBank = await this.findOne(id);

    await this.drizzle.delete(savingsBank).where(eq(savingsBank.id, id));

    return { message: 'Savings bank deleted successfully' };
  }
}
