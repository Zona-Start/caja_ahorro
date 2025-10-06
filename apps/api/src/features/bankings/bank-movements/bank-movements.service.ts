import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  bankTransactions,
  internalTransactionBankLinks,
} from '@/database/index';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateBankMovementDto,
  LinkToInternalRecordDto,
  QueryBankMovementDto,
  UpdateBankMovementDto,
} from './dto';

@Injectable()
export class BankMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    createBankMovementDto: CreateBankMovementDto,
    userId?: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const dtoForInsert = {
      ...createBankMovementDto,
      debitAmount:
        createBankMovementDto.debitAmount !== undefined &&
        createBankMovementDto.debitAmount !== null
          ? String(createBankMovementDto.debitAmount)
          : null,
      creditAmount:
        createBankMovementDto.creditAmount !== undefined &&
        createBankMovementDto.creditAmount !== null
          ? String(createBankMovementDto.creditAmount)
          : null,
      createdById: userId ?? createBankMovementDto.createdById,
    };

    const [createdMovement] = await db
      .insert(bankTransactions)
      .values(dtoForInsert)
      .returning();

    if (createBankMovementDto.category === 'INTERNAL_TRANSFER') {
      await db.insert(internalTransactionBankLinks).values({
        bankTransactionId: createdMovement.id,
        internalRecordType: createBankMovementDto.internalRecordType,
        internalRecordId: createBankMovementDto.internalRecordId,
        linkedBy: userId,
        createdById: userId,
      });
    }

    return createdMovement;
  }

  async findAll(query: QueryBankMovementDto) {
    const { page = 1, limit = 10, bankAccountId, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    const whereConditions = and(
      bankAccountId
        ? eq(bankTransactions.bankAccountId, bankAccountId)
        : undefined,
      startDate ? gte(bankTransactions.transactionDate, startDate) : undefined,
      endDate ? lte(bankTransactions.transactionDate, endDate) : undefined,
    );

    const [total] = await this.drizzle
      .select({ value: count() })
      .from(bankTransactions)
      .where(whereConditions);

    const data = await this.drizzle
      .select()
      .from(bankTransactions)
      .where(whereConditions)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: total.value,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const [movement] = await this.drizzle
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.id, id));

    if (!movement) {
      throw new NotFoundException(`Bank movement with ID ${id} not found`);
    }

    return movement;
  }

  async update(id: number, updateBankMovementDto: UpdateBankMovementDto) {
    const dtoForUpdate = {
      ...updateBankMovementDto,
      debitAmount:
        updateBankMovementDto.debitAmount !== undefined &&
        updateBankMovementDto.debitAmount !== null
          ? String(updateBankMovementDto.debitAmount)
          : null,
      creditAmount:
        updateBankMovementDto.creditAmount !== undefined &&
        updateBankMovementDto.creditAmount !== null
          ? String(updateBankMovementDto.creditAmount)
          : null,
    };

    const [updatedMovement] = await this.drizzle
      .update(bankTransactions)
      .set(dtoForUpdate)
      .where(eq(bankTransactions.id, id))
      .returning();

    if (!updatedMovement) {
      throw new NotFoundException(`Bank movement with ID ${id} not found`);
    }

    return updatedMovement;
  }

  async remove(id: number) {
    const [deletedMovement] = await this.drizzle
      .delete(bankTransactions)
      .where(eq(bankTransactions.id, id))
      .returning();

    if (!deletedMovement) {
      throw new NotFoundException(`Bank movement with ID ${id} not found`);
    }

    return { message: `Bank movement with ID ${id} successfully deleted` };
  }

  async linkToInternalRecord(
    bankTransactionId: number,
    linkDto: LinkToInternalRecordDto,
    userId: number,
  ) {
    await this.findOne(bankTransactionId); // Check if bank transaction exists

    const existingLink = await this.drizzle
      .select()
      .from(internalTransactionBankLinks)
      .where(
        eq(internalTransactionBankLinks.bankTransactionId, bankTransactionId),
      );

    if (existingLink.length > 0) {
      throw new ConflictException(
        `Bank transaction with ID ${bankTransactionId} is already linked.`,
      );
    }

    const [newLink] = await this.drizzle
      .insert(internalTransactionBankLinks)
      .values({
        bankTransactionId,
        internalRecordType: linkDto.internalRecordType,
        internalRecordId: linkDto.internalRecordId,
        linkedBy: userId,
      })
      .returning();

    await this.drizzle
      .update(bankTransactions)
      .set({ internalLinkStatus: 'LINKED' })
      .where(eq(bankTransactions.id, bankTransactionId));

    return newLink;
  }

  async unlinkFromInternalRecord(bankTransactionId: number) {
    const [deletedLink] = await this.drizzle
      .delete(internalTransactionBankLinks)
      .where(
        eq(internalTransactionBankLinks.bankTransactionId, bankTransactionId),
      )
      .returning();

    if (!deletedLink) {
      throw new NotFoundException(
        `No link found for bank transaction with ID ${bankTransactionId}`,
      );
    }

    await this.drizzle
      .update(bankTransactions)
      .set({ internalLinkStatus: 'UNLINKED' })
      .where(eq(bankTransactions.id, bankTransactionId));

    return {
      message: `Successfully unlinked bank transaction with ID ${bankTransactionId}`,
    };
  }

  async findInternalLink(bankTransactionId: number) {
    const [link] = await this.drizzle
      .select()
      .from(internalTransactionBankLinks)
      .where(
        eq(internalTransactionBankLinks.bankTransactionId, bankTransactionId),
      );

    if (!link) {
      throw new NotFoundException(
        `No link found for bank transaction with ID ${bankTransactionId}`,
      );
    }

    return link;
  }
}
