import { PaginationDto } from '@/common/dto/pagination.dto';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateSalesProductCategoryDto } from './dto/create-sales-product-category.dto';
import { UpdateSalesProductCategoryDto } from './dto/update-sales-product-category.dto';

@Injectable()
export class SalesProductCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  private async findByName(name: string) {
    return await this.drizzle.query.salesProductCategories.findFirst({
      where: eq(schema.salesProductCategories.name, name),
    });
  }

  async create(
    userId: number,
    createSalesProductCategoryDto: CreateSalesProductCategoryDto,
  ) {
    const product = await this.findByName(createSalesProductCategoryDto.name);

    if (product) {
      throw new NotFoundException(
        `Category with name ${createSalesProductCategoryDto.name} already exists`,
      );
    }

    const newCategory = await this.drizzle
      .insert(schema.salesProductCategories)
      .values({
        ...createSalesProductCategoryDto,
        createdById: userId,
      })
      .returning();

    if (!newCategory.length) {
      throw new NotFoundException(
        `Category with name ${createSalesProductCategoryDto.name} not created`,
      );
    }

    return {
      message: `Category with name ${createSalesProductCategoryDto.name} created`,
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
      searchConditions.push(eq(schema.salesProductCategories.name, search));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.salesProductCategories[sortBy as keyof typeof schema.salesProductCategories]} asc`
        : sql`${schema.salesProductCategories[sortBy as keyof typeof schema.salesProductCategories]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.salesProductCategories)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.salesProductCategories.id,
        name: schema.salesProductCategories.name,
        description: schema.salesProductCategories.description,
      })
      .from(schema.salesProductCategories)
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
    const category = await this.drizzle.query.salesProductCategories.findFirst({
      where: eq(schema.salesProductCategories.id, id),
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async findAllCategories() {
    return await this.drizzle
      .select({
        id: schema.salesProductCategories.id,
        name: schema.salesProductCategories.name,
      })
      .from(schema.salesProductCategories);
  }

  async update(
    id: number,
    updateSalesProductCategoryDto: UpdateSalesProductCategoryDto,
    userId: number,
  ) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const updatedCategory = await this.drizzle
      .update(schema.salesProductCategories)
      .set({
        ...updateSalesProductCategoryDto,
        updatedById: userId,
      })
      .where(eq(schema.salesProductCategories.id, id))
      .returning();

    return {
      message: `Category with name ${updatedCategory[0].name} update`,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedCategory = await this.drizzle
      .delete(schema.salesProductCategories)
      .where(eq(schema.salesProductCategories.id, id))
      .returning();

    if (!deletedCategory.length) {
      throw new NotFoundException(`Category with id ${id} not delete`);
    }

    return {
      message: `Category with name ${deletedCategory[0].name} delete success`,
    };
  }
}
