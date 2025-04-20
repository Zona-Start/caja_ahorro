import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike } from 'drizzle-orm';
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

    if (!loanType.id) {
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
      .insert(schema.loanTypes)
      .values({
        ...createLoanTypeDto,
        interestRate_annual: createLoanTypeDto.interestRate_annual.toString(),
        maxLoanAmount: createLoanTypeDto.maxLoanAmount.toString(),
        minLoanAmount: createLoanTypeDto.minLoanAmount.toString(),
        createdById: userId,
      })
      .returning();

    return loanType;
  }

  async findAll(search?: string) {
    if (search) {
      return await this.drizzle
        .select()
        .from(schema.loanTypes)
        .where(ilike(schema.loanTypes.name, `%${search}%`));
    }
    return await this.drizzle.select().from(schema.loanTypes);
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
        interestRate_annual: updateLoanTypeDto.interestRate_annual.toString(),
        maxLoanAmount: updateLoanTypeDto.maxLoanAmount.toString(),
        minLoanAmount: updateLoanTypeDto.minLoanAmount.toString(),
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
