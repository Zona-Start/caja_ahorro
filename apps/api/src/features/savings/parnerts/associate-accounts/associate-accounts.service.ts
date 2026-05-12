import {
  associateAccounts,
  associates,
} from '@/database/schema/tables/savings';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { AssociateAccounts } from './entities/associate-accounts.entity';

@Injectable()
export class AssociateAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findOne(tenantId: string, id: string): Promise<AssociateAccounts> {
    const result = await this.drizzle
      .select({ account: associateAccounts })
      .from(associateAccounts)
      .innerJoin(associates, eq(associateAccounts.associateId, associates.id))
      .where(
        and(eq(associateAccounts.id, id), eq(associates.tenantId, tenantId)),
      );

    if (!result.length) {
      throw new NotFoundException(`Associate Accounts with ID ${id} not found`);
    }

    return result[0].account as AssociateAccounts;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: any,
  ): Promise<AssociateAccounts> {
    await this.findOne(tenantId, id);

    const updateData: any = {
      updatedById: userId,
    };

    if (dto.accountNumber !== undefined)
      updateData.accountNumber = dto.accountNumber;
    if (dto.currencyCode !== undefined)
      updateData.currencyCode = dto.currencyCode;
    if (dto.openingDate !== undefined)
      updateData.openingDate =
        dto.openingDate?.toISOString?.()?.split('T')[0] ?? dto.openingDate;
    if (dto.closingDate !== undefined)
      updateData.closingDate =
        dto.closingDate?.toISOString?.()?.split('T')[0] ?? dto.closingDate;
    if (dto.bankDirectoryId !== undefined)
      updateData.bankDirectoryId = dto.bankDirectoryId;
    if (dto.status !== undefined) updateData.status = dto.status;

    const [result] = await this.drizzle
      .update(associateAccounts)
      .set(updateData)
      .where(eq(associateAccounts.id, id))
      .returning();

    return result as AssociateAccounts;
  }
}
