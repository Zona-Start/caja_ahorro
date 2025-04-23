import { associateAccounts } from '@/database/schema/savings-banks';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateAssociateAccountsDto } from './dto/update-associate-accounts.dto';
import { AssociateAccounts } from './entities/associate-accounts.entity';

@Injectable()
export class AssociateAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(associateAccounts)
      .where(eq(associateAccounts.id, id));

    if (!result.length) {
      throw new NotFoundException(`Associate Accounts with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    userId: number,
    id: number,
    updateAssociateAccountsDto: UpdateAssociateAccountsDto,
  ): Promise<AssociateAccounts> {
    const isExisting = await this.findOne(id);

    if (!isExisting) {
      throw new NotFoundException(`Associate Accounts with ID ${id} not found`);
    }

    const result = await this.drizzle
      .update(associateAccounts)
      .set({
        associateId: updateAssociateAccountsDto.associateId,
        accountNumber: updateAssociateAccountsDto.accountNumber?.toString(),
        currencyCode: updateAssociateAccountsDto.currencyCode,
        balance: (
          (updateAssociateAccountsDto.salaryTotal || 0) * 0.1
        ).toString(),
        openingDate: updateAssociateAccountsDto.openingDate?.toString(),
        bankDirectoryId: updateAssociateAccountsDto.bankDirectoryId,
        salary: updateAssociateAccountsDto.salary?.toString(),
        salaryTotal: updateAssociateAccountsDto.salaryTotal?.toString(),
        status: updateAssociateAccountsDto.status,
        updatedById: userId,
      })
      .where(eq(associateAccounts.id, id))
      .returning();

    const convertedResult = {
      ...result[0],
      balance: Number(result[0].balance),
      openingDate: result[0].openingDate
        ? new Date(result[0].openingDate)
        : null,
      salary: Number(result[0].salary),
      salaryTotal: Number(result[0].salaryTotal),
    } as AssociateAccounts;
    return convertedResult;
  }
}
