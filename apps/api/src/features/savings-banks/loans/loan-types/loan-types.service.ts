import { PaginationDto } from '@/common/dto/pagination.dto';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { loanTypes as loanTypesSchema } from '@/database/schema/savings-banks';
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
  private async findloanTypeById(name: string) {
    const [loanType] = await this.drizzle
      .select()
      .from(schema.loanTypes)
      .where(eq(schema.loanTypes.name, name));

    if (!loanType) {
      return false;
    }

    return true;
  }

  async create(createLoanTypeDto: CreateLoanTypeDto, userId: number) {
    const loanTypeExists = await this.findloanTypeById(createLoanTypeDto.name);
    if (loanTypeExists) {
      throw new NotFoundException(`Loan type already exists`);
    }
    const [loanType] = await this.drizzle
      .insert(loanTypesSchema)
      .values({
        ...createLoanTypeDto,
        name: createLoanTypeDto.name.toUpperCase(),
        interestRateAnnual: createLoanTypeDto.interestRateAnnual.toString(),
        maxLoanAmount: createLoanTypeDto.maxLoanAmount
          ? createLoanTypeDto.maxLoanAmount.toString()
          : null,
        minLoanAmount: createLoanTypeDto.minLoanAmount
          ? createLoanTypeDto.minLoanAmount.toString()
          : null,
        createdById: userId,
      })
      .returning({
        id: loanTypesSchema.id,
        name: loanTypesSchema.name,
        description: loanTypesSchema.description,
        interestRateAnnual: loanTypesSchema.interestRateAnnual,
        maxLoanAmount: loanTypesSchema.maxLoanAmount,
        minLoanAmount: loanTypesSchema.minLoanAmount,
        termMonthsMin: loanTypesSchema.termMonthsMin,
        termMonthsMax: loanTypesSchema.termMonthsMax,
      });

    return loanType;
  }

  async findAll() {
    return await this.drizzle
      .select({
        id: schema.loanTypes.id,
        name: schema.loanTypes.name,
        description: schema.loanTypes.description,
        interestRateAnnual: schema.loanTypes.interestRateAnnual,
        maxLoanAmount: schema.loanTypes.maxLoanAmount,
        minLoanAmount: schema.loanTypes.minLoanAmount,
        termMonthsMin: schema.loanTypes.termMonthsMin,
        termMonthsMax: schema.loanTypes.termMonthsMax,
      })
      .from(schema.loanTypes);
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
      .select({
        id: schema.loanTypes.id,
        name: schema.loanTypes.name,
        description: schema.loanTypes.description,
        interestRateAnnual: schema.loanTypes.interestRateAnnual,
        maxLoanAmount: schema.loanTypes.maxLoanAmount,
        minLoanAmount: schema.loanTypes.minLoanAmount,
        termMonthsMin: schema.loanTypes.termMonthsMin,
        termMonthsMax: schema.loanTypes.termMonthsMax,
      })
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
      .select({
        id: schema.loanTypes.id,
        name: schema.loanTypes.name,
        description: schema.loanTypes.description,
        interestRateAnnual: schema.loanTypes.interestRateAnnual,
        maxLoanAmount: schema.loanTypes.maxLoanAmount,
        minLoanAmount: schema.loanTypes.minLoanAmount,
        termMonthsMin: schema.loanTypes.termMonthsMin,
        termMonthsMax: schema.loanTypes.termMonthsMax,
      })
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
        name: updateLoanTypeDto.name.toUpperCase(),
        interestRateAnnual: updateLoanTypeDto.interestRateAnnual.toString(),
        maxLoanAmount: updateLoanTypeDto.maxLoanAmount
          ? updateLoanTypeDto.maxLoanAmount.toString()
          : null,
        minLoanAmount: updateLoanTypeDto.minLoanAmount
          ? updateLoanTypeDto.minLoanAmount.toString()
          : null,
        updatedById: userId,
      })
      .where(eq(schema.loanTypes.id, id))
      .returning({
        id: schema.loanTypes.id,
        name: schema.loanTypes.name,
        description: schema.loanTypes.description,
        interestRateAnnual: schema.loanTypes.interestRateAnnual,
        maxLoanAmount: schema.loanTypes.maxLoanAmount,
        minLoanAmount: schema.loanTypes.minLoanAmount,
        termMonthsMin: schema.loanTypes.termMonthsMin,
        termMonthsMax: schema.loanTypes.termMonthsMax,
      });

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
