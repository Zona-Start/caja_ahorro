import { accountsAssociates } from '@/database/schema/saving-banks';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateAccountAssociateDto } from './dto/create-account-associate.dto';
import { UpdateAccountAssociateDto } from './dto/update-account-associate.dto';

@Injectable()
export class AccountsAssociatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createAccountAssociateDto: CreateAccountAssociateDto) {
    // Convert account number to string since DB schema expects string
    const accountData = {
      ...createAccountAssociateDto,
      accountNumber: createAccountAssociateDto.accountNumber.toString(),
      balance: createAccountAssociateDto.balance?.toString(), // Convert balance to string to match schema
    };

    const result = await this.drizzle
      .insert(accountsAssociates)
      .values(accountData)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(accountsAssociates);
  }

  async findAllByAssociateId(associatedId: number) {
    return await this.drizzle
      .select()
      .from(accountsAssociates)
      .where(eq(accountsAssociates.associatedId, associatedId));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(accountsAssociates)
      .where(eq(accountsAssociates.id, id));

    if (!result.length) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    id: number,
    updateAccountAssociateDto: UpdateAccountAssociateDto,
  ) {
    const existingAccount = await this.findOne(id);

    // Convert account number to string if it exists in the update DTO
    const updateData = {
      ...updateAccountAssociateDto,
      accountNumber: updateAccountAssociateDto.accountNumber?.toString(),
      balance: updateAccountAssociateDto.balance?.toString(),
    };

    const result = await this.drizzle
      .update(accountsAssociates)
      .set(updateData)
      .where(eq(accountsAssociates.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingAccount = await this.findOne(id);

    await this.drizzle
      .delete(accountsAssociates)
      .where(eq(accountsAssociates.id, id));

    return { message: 'Account deleted successfully' };
  }
}
