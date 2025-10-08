import { PaginationDto } from '@/common/dto/pagination.dto';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { loanTypes as loanTypesSchema } from '@/database/schema/tables/savings-banks';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';

@Injectable()
export class LoanTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}
  private async findloanTypeByName(name: string): Promise<boolean> {
    const [loanType] = await this.drizzle
      .select()
      .from(schema.loanTypes)
      .where(eq(schema.loanTypes.name, name));

    return !!loanType;
  }

  async create(createLoanTypeDto: CreateLoanTypeDto, userId: number) {
    const loanTypeExists = await this.findloanTypeByName(
      createLoanTypeDto.name,
    );
    if (loanTypeExists) {
      throw new NotFoundException(
        `Loan type with name "${createLoanTypeDto.name}" already exists`,
      );
    }

    const [loanType] = await this.drizzle
      .insert(loanTypesSchema)
      .values({
        ...createLoanTypeDto,
        name: createLoanTypeDto.name,
        interestRate: createLoanTypeDto.interestRate.toString(),
        cancellationPercentage:
          createLoanTypeDto.cancellationPercentage?.toString() ?? null,
        maxLoanAmount: createLoanTypeDto.maxLoanAmount?.toString() ?? null,
        minLoanAmount: createLoanTypeDto.minLoanAmount?.toString() ?? null,
        specialQuotaPercentage:
          createLoanTypeDto.specialQuotaPercentage?.toString() ?? null,
        administrativeExpensePercentage:
          createLoanTypeDto.administrativeExpensePercentage?.toString() ?? null,
        createdById: userId,
      })
      .returning();

    return loanType;
  }

  async findAll() {
    return await this.drizzle.select().from(schema.loanTypes);
  }

  async findAllByPagination(paginationDto?: PaginationDto) {
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
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(schema.loanTypes.name, `%${search}%`);
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.loanTypes[sortBy as keyof typeof schema.loanTypes]} asc`
        : sql`${schema.loanTypes[sortBy as keyof typeof schema.loanTypes]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.loanTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select()
      .from(schema.loanTypes)
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

    return { data, meta };
  }

  async findOne(id: number) {
    const [loanType] = await this.drizzle
      .select()
      .from(schema.loanTypes)
      .where(eq(schema.loanTypes.id, id));

    if (!loanType) {
      throw new NotFoundException(`Loan type with ID ${id} not found`);
    }

    return loanType;
  }

  async update(
    id: number,
    updateLoanTypeDto: UpdateLoanTypeDto,
    userId: number,
  ) {
    const [updatedLoanType] = await this.drizzle
      .update(schema.loanTypes)
      .set({
        ...updateLoanTypeDto,
        name: updateLoanTypeDto.name?.toUpperCase(),
        interestRate: updateLoanTypeDto.interestRate?.toString(),
        cancellationPercentage:
          updateLoanTypeDto.cancellationPercentage?.toString() ?? null,
        maxLoanAmount: updateLoanTypeDto.maxLoanAmount?.toString() ?? null,
        minLoanAmount: updateLoanTypeDto.minLoanAmount?.toString() ?? null,
        specialQuotaPercentage:
          updateLoanTypeDto.specialQuotaPercentage?.toString() ?? null,
        administrativeExpensePercentage:
          updateLoanTypeDto.administrativeExpensePercentage?.toString() ?? null,
        updatedById: userId,
      })
      .where(eq(schema.loanTypes.id, id))
      .returning();

    if (!updatedLoanType) {
      throw new NotFoundException(`Loan type with ID ${id} not found`);
    }

    return updatedLoanType;
  }
  async remove(id: number) {
    const [deletedLoanType] = await this.drizzle
      .delete(schema.loanTypes)
      .where(eq(schema.loanTypes.id, id))
      .returning();

    if (!deletedLoanType) {
      throw new NotFoundException(`Loan type with ID ${id} not found`);
    }

    return deletedLoanType;
  }
}
