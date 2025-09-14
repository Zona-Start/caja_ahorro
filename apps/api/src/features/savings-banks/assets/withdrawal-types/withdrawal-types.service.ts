import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { withdrawalTypes } from 'src/database/index';
import { CreateWithdrawalTypeDto } from './dto/create-withdrawal-type.dto';
import { UpdateWithdrawalTypeDto } from './dto/update-withdrawal-type.dto';

@Injectable()
export class WithdrawalTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}
  async create(
    createWithdrawalTypeDto: CreateWithdrawalTypeDto,
    userId: number,
  ) {
    // Verifica si ya existe una descripción igual
    const exists = await this.drizzle
      .select()
      .from(withdrawalTypes)
      .where(
        eq(withdrawalTypes.description, createWithdrawalTypeDto.description),
      );

    if (exists.length > 0) {
      throw new BadRequestException(
        'Ya existe un tipo de retiro con esa descripción',
      );
    }

    const [created] = await this.drizzle
      .insert(withdrawalTypes)
      .values({
        description: createWithdrawalTypeDto.description,
        accountDebit: createWithdrawalTypeDto.accountDebit,
        expenseAccount: createWithdrawalTypeDto.expenseAccount,
        withdrawalLimitQuantity:
          createWithdrawalTypeDto.withdrawalLimitQuantity,
        minimumAntiquityDays: createWithdrawalTypeDto.minimumAntiquityDays,
        withdrawalFrequencyRelation:
          createWithdrawalTypeDto.withdrawalFrequencyRelation,
        withdrawalPercentage:
          createWithdrawalTypeDto.withdrawalPercentage !== undefined &&
          createWithdrawalTypeDto.withdrawalPercentage !== null
            ? String(createWithdrawalTypeDto.withdrawalPercentage)
            : null,
        administrativeFeePercentage:
          createWithdrawalTypeDto.administrativeFeePercentage !== undefined &&
          createWithdrawalTypeDto.administrativeFeePercentage !== null
            ? String(createWithdrawalTypeDto.administrativeFeePercentage)
            : null,
        createdById: userId,
        isHouseComercial: createWithdrawalTypeDto.isHouseComercial ?? false,
        isInternalInventory:
          createWithdrawalTypeDto.isInternalInventory ?? false,
      })
      .returning();

    if (!created) {
      throw new NotFoundException(`WithdrawalType error create`);
    }
    // Retorna una respuesta de éxito
    return {
      message: 'Withdrawal Type create success',
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(withdrawalTypes.description, `%${search}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${withdrawalTypes[sortBy as keyof typeof withdrawalTypes]} asc`
        : sql`${withdrawalTypes[sortBy as keyof typeof withdrawalTypes]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: withdrawalTypes.id,
        description: withdrawalTypes.description,
        withdrawalPercentage: withdrawalTypes.withdrawalPercentage,
        accountDebit: withdrawalTypes.accountDebit,
        expenseAccount: withdrawalTypes.expenseAccount,
        administrativeFeePercentage:
          withdrawalTypes.administrativeFeePercentage,
        withdrawalLimitQuantity: withdrawalTypes.withdrawalLimitQuantity,
        minimumAntiquityDays: withdrawalTypes.minimumAntiquityDays,
        withdrawalFrequencyRelation:
          withdrawalTypes.withdrawalFrequencyRelation,
        isHouseComercial: withdrawalTypes.isHouseComercial,
        isInternalInventory: withdrawalTypes.isInternalInventory,
      })
      .from(withdrawalTypes)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data,
      meta,
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select({
        id: withdrawalTypes.id,
        description: withdrawalTypes.description,
        withdrawalPercentage: withdrawalTypes.withdrawalPercentage,
        accountDebit: withdrawalTypes.accountDebit,
        expenseAccount: withdrawalTypes.expenseAccount,
        administrativeFeePercentage:
          withdrawalTypes.administrativeFeePercentage,
        withdrawalLimitQuantity: withdrawalTypes.withdrawalLimitQuantity,
        minimumAntiquityDays: withdrawalTypes.minimumAntiquityDays,
        withdrawalFrequencyRelation:
          withdrawalTypes.withdrawalFrequencyRelation,
        isHouseComercial: withdrawalTypes.isHouseComercial,
        isInternalInventory: withdrawalTypes.isInternalInventory,
      })
      .from(withdrawalTypes)
      .where(eq(withdrawalTypes.id, id));
    if (!result.length) {
      throw new NotFoundException(`WithdrawalType with ID ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateWithdrawalTypeDto: UpdateWithdrawalTypeDto,
    userId: number,
  ) {
    const exists = await this.findOne(id);
    if (!exists) {
      throw new NotFoundException(`WithdrawalType with ID ${id} not found`);
    }

    // Convert number fields to string or null as required by the schema
    const updateData = {
      ...updateWithdrawalTypeDto,
      withdrawalPercentage:
        updateWithdrawalTypeDto.withdrawalPercentage !== undefined &&
        updateWithdrawalTypeDto.withdrawalPercentage !== null
          ? String(updateWithdrawalTypeDto.withdrawalPercentage)
          : null,
      administrativeFeePercentage:
        updateWithdrawalTypeDto.administrativeFeePercentage !== undefined &&
        updateWithdrawalTypeDto.administrativeFeePercentage !== null
          ? String(updateWithdrawalTypeDto.administrativeFeePercentage)
          : null,
      isHouseComercial: updateWithdrawalTypeDto.isHouseComercial,
      isInternalInventory: updateWithdrawalTypeDto.isInternalInventory,
      updatedById: userId,
    };

    const [updated] = await this.drizzle
      .update(withdrawalTypes)
      .set(updateData)
      .where(eq(withdrawalTypes.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`WithdrawalType error update`);
    }
    return {
      message: 'Withdrawal Type udpate success',
    };
  }

  async remove(id: number) {
    const exists = await this.findOne(id);
    if (!exists) {
      throw new NotFoundException(`WithdrawalType with ID ${id} not found`);
    }
    const [deleted] = await this.drizzle
      .delete(withdrawalTypes)
      .where(eq(withdrawalTypes.id, id))
      .returning();
    return deleted;

    if (!deleted) {
      throw new NotFoundException(`WithdrawalType error delete`);
    }
    return {
      message: 'Withdrawal Type delete success',
    };
  }
}
