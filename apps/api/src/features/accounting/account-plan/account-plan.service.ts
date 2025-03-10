import { accountPlan } from '@/database/schema/accounting';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateAccountPlanDto } from './dto//update-account-plan.dto';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';

@Injectable()
export class AccountPlanService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createAccountPlanDto: CreateAccountPlanDto) {
    const result = await this.drizzle
      .insert(accountPlan)
      .values(createAccountPlanDto)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(accountPlan);
  }

  async findAllBySavingsBank(savingBankId: number) {
    return await this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.savingBankId, savingBankId));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.id, id));

    if (!result.length) {
      throw new NotFoundException(`Account Plan with ID ${id} not found`);
    }

    return result[0];
  }

  async update(id: number, updateAccountPlanDto: UpdateAccountPlanDto) {
    const existingAccountPlan = await this.findOne(id);

    const result = await this.drizzle
      .update(accountPlan)
      .set({
        ...updateAccountPlanDto,
      })
      .where(eq(accountPlan.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingAccountPlan = await this.findOne(id);

    await this.drizzle.delete(accountPlan).where(eq(accountPlan.id, id));

    return { message: 'Account Plan deleted successfully' };
  }
}
