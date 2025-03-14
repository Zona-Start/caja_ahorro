import { accountPlan } from '@/database/schema/accounting';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, like, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateAccountPlanDto } from './dto//update-account-plan.dto';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { AccountPlan } from './entities/account-plan.entity';

@Injectable()
export class AccountPlanService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAccountPlanByCode(code: string) {
    return this.drizzle.select().from(accountPlan).where(eq(accountPlan.code, code))
  }

  async create(createAccountPlanDto: CreateAccountPlanDto) {
    const existsAccountPlan = await this.findAccountPlanByCode(createAccountPlanDto.code)

    if (!existsAccountPlan.length) {
      throw new NotFoundException(`Account Plan exits`);
    }
    const result = await this.drizzle
      .insert(accountPlan)
      .values(createAccountPlanDto)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(accountPlan);
  }

  async findAllByPagination(paginationDto?: PaginationDto): Promise<{ data: AccountPlan[], meta: any }> {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'asc' } = paginationDto || {};

     // Calculate offset
     const offset = (page - 1) * limit;
    
     // Build search condition
     let searchCondition: SQL<unknown> | undefined;
     if (search) {
       searchCondition = or(
         like(accountPlan.code, `%${search}%`),
         like(accountPlan.name, `%${search}%`),
         like(accountPlan.level, `%${search}%`),
         like(accountPlan.parent_account_id, `%${search}%`)
       );
     }

         // Build sort condition
    const orderBy = sortOrder === 'asc' 
    ? sql`${accountPlan[sortBy as keyof typeof accountPlan]} asc` 
    : sql`${accountPlan[sortBy as keyof typeof accountPlan]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountPlan)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
     
     // Get paginated data
     const data = await this.drizzle
     .select({
       id: accountPlan.id,
       code: accountPlan.code,
       name: accountPlan.name,
       type: accountPlan.type,
       description: accountPlan.description,
       level: accountPlan.level,
       parent_account_id: accountPlan.parent_account_id,
     })
     .from(accountPlan)
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

    if (!existingAccountPlan) {
      throw new NotFoundException(`Update Account Plan with ID ${id} not found`);
    }

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
    if (!existingAccountPlan) {
      throw new NotFoundException(`Delete Account Plan with ID ${id} not found`);
    }

    await this.drizzle.delete(accountPlan).where(eq(accountPlan.id, id));

    return { message: 'Account Plan deleted successfully' };
  }
}
