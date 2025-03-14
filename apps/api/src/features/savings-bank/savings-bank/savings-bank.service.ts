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

  async findSavingBank (rif: string) {
    return this.drizzle.select().from(savingsBank).where(eq(savingsBank.rif, rif))
  } 

  async create(createSavingsBankDto: CreateSavingsBankDto) {
    const existingBank  = await this.findSavingBank(createSavingsBankDto.rif)

    if (!existingBank.length) {
      throw new NotFoundException(`Savings bank found`);
    }

    const existingAllBank = await this.findAll()

    if (!existingAllBank.length) {
      throw new NotFoundException(`Savings bank found`);
    }

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

    if (!existingBank) {
      throw new NotFoundException(`Savings bank not found`);
    }

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

    if (!existingBank) {
      throw new NotFoundException(`Savings bank not found`);
    }

    await this.drizzle.delete(savingsBank).where(eq(savingsBank.id, id));

    return { message: 'Savings bank deleted successfully' };
  }
}
