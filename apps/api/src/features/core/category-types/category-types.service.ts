import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { categoryType } from '@/database/schema/core';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateCategoryTypeDto } from './dto/create-category-type.dto';
import { FilterCategoryTypeDto } from './dto/filter-category-type.dto';
import { UpdateCategoryTypeDto } from './dto/update-category-type.dto';
import { CategoryType } from './entities/category-type.entity';

@Injectable()
export class CategoryTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<CategoryType[]> {
    const categories = await this.drizzle.select().from(categoryType);
    return categories.map((category) => ({
      ...category,
      options: category.options as JSON,
    })) as CategoryType[];
  }

  async findOne(id: number): Promise<CategoryType> {
    const category = await this.drizzle
      .select()
      .from(categoryType)
      .where(eq(categoryType.id, id));

    if (category.length === 0) {
      throw new HttpException('Category type not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...category[0],
      options: category[0].options as JSON,
    } as CategoryType;
  }

  async findByGroup(group: string): Promise<CategoryType[]> {
    const category = await this.drizzle
      .select()
      .from(categoryType)
      .where(eq(categoryType.group, group));

    if (category.length === 0) {
      throw new HttpException(
        'Category type by group not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return category.map((cat) => ({
      ...cat,
      options: cat.options as JSON,
    })) as CategoryType[];
  }

  async findAllByPagination(
    paginationDto?: FilterCategoryTypeDto,
  ): Promise<{ data: CategoryType[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      group = '',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(categoryType.description, `%${search}%`));
    }

    if (group) {
      searchConditions.push(eq(categoryType.group, group));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${categoryType[sortBy as keyof typeof categoryType]} asc`
        : sql`${categoryType[sortBy as keyof typeof categoryType]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(categoryType)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: categoryType.id,
        group: categoryType.group,
        description: categoryType.description,
        options: categoryType.options,
      })
      .from(categoryType)
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
    const transform = data.map((category) => {
      return {
        ...category,
        options: category.options as JSON,
      } as CategoryType;
    });

    return { data: transform, meta };
  }

  async create(
    id: string,
    createCategoryTypeDto: CreateCategoryTypeDto,
  ): Promise<CategoryType> {
    const findCategory = await this.drizzle
      .select()
      .from(categoryType)
      .where(
        and(
          eq(categoryType.group, createCategoryTypeDto.group),
          eq(categoryType.description, createCategoryTypeDto.description),
        ),
      );

    if (findCategory.length !== 0) {
      throw new HttpException(
        'Category type alredy exists',
        HttpStatus.NOT_FOUND,
      );
    }
    const [category] = await this.drizzle
      .insert(categoryType)
      .values({
        group: createCategoryTypeDto.group,
        description: createCategoryTypeDto.description,
        options: createCategoryTypeDto.options,
        createdById: parseInt(id),
      })
      .returning();

    return {
      ...category,
      options: category.options as JSON,
    } as CategoryType;
  }

  async update(
    updateById: string,
    id: number,
    updateCategoryTypeDto: UpdateCategoryTypeDto,
  ): Promise<CategoryType> {
    // Check if category type exists
    await this.findOne(id);

    const category = await this.drizzle
      .update(categoryType)
      .set({
        group: updateCategoryTypeDto.group,
        description: updateCategoryTypeDto.description,
        options: updateCategoryTypeDto.options,
        updatedById: parseInt(updateById),
      })
      .where(eq(categoryType.id, id))
      .returning();

    return {
      ...category[0],
      options: category[0].options as JSON,
    } as CategoryType;
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if category type exists
    await this.findOne(id);

    await this.drizzle.delete(categoryType).where(eq(categoryType.id, id));

    return { message: 'Category type deleted successfully' };
  }
}
