import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { banks } from '../../../database/schema/bank';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Injectable()
export class BankService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.drizzle.select().from(banks);
  }

  async findOne(id: string) {
    const [result] = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.id, parseInt(id)));

    return result;
  }

  async findByCode(code: string) {
    const [result] = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.code, code));

    return result;
  }

  async create(data: CreateBankDto) {
    const bank = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.code, data.code));
    if (bank.length !== 0) {
      throw new HttpException('Banks  exist', HttpStatus.BAD_REQUEST);
    }

    const [result] = await this.drizzle.insert(banks).values(data).returning();

    return result;
  }

  async update(id: string, data: UpdateBankDto) {
    const [result] = await this.drizzle
      .update(banks)
      .set(data)
      .where(eq(banks.id, parseInt(id)))
      .returning();

    return result;
  }

  async remove(id: string) {
    const [result] = await this.drizzle
      .delete(banks)
      .where(eq(banks.id, parseInt(id)))
      .returning();

    return result;
  }
}
