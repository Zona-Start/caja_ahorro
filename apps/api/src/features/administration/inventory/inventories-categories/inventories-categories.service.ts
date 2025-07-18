import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateInventoryCategoryDto } from './dto/create-inventories-category.dto';
import { FilterInventoryCategoryDto } from './dto/filter-onventories-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventories-category.dto';
import { InventoriesCategories } from './entities/inventories-category.entity';

@Injectable()
export class InventoriesCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  private async findByName(name: string, group: string) {
    return await this.drizzle.query.inventoriesCategories.findFirst({
      where: and(
        eq(schema.inventoriesCategories.name, name),
        eq(schema.inventoriesCategories.group, group),
      ),
    });
  }

  async create(userId: number, dto: CreateInventoryCategoryDto) {
    const product = await this.findByName(dto.name, dto.group);

    if (product) {
      throw new NotFoundException(
        `Category with name ${dto.name} already exists`,
      );
    }

    const newCategory = await this.drizzle
      .insert(schema.inventoriesCategories)
      .values({
        ...dto,
        createdById: userId,
      })
      .returning();

    if (!newCategory.length) {
      throw new NotFoundException(`Category with name ${dto.name} not created`);
    }

    return {
      message: `Category with name ${dto.name} created`,
    };
  }

  async findAll(paginationDto: FilterInventoryCategoryDto) {
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
      searchConditions.push(eq(schema.inventoriesCategories.name, search));
    }

    if (group) {
      searchConditions.push(eq(schema.inventoriesCategories.group, group));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.inventoriesCategories[sortBy as keyof typeof schema.inventoriesCategories]} asc`
        : sql`${schema.inventoriesCategories[sortBy as keyof typeof schema.inventoriesCategories]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.inventoriesCategories)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.inventoriesCategories.id,
        name: schema.inventoriesCategories.name,
        description: schema.inventoriesCategories.description,
      })
      .from(schema.inventoriesCategories)
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

  async findOne(id: number): Promise<InventoriesCategories> {
    const category = await this.drizzle.query.inventoriesCategories.findFirst({
      where: eq(schema.inventoriesCategories.id, id),
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async findAllCategories(
    group: string,
  ): Promise<{ id: number; name: string }[]> {
    return await this.drizzle
      .select({
        id: schema.inventoriesCategories.id,
        name: schema.inventoriesCategories.name,
      })
      .from(schema.inventoriesCategories)
      .where(eq(schema.inventoriesCategories.group, group));
  }

  async update(id: number, dto: UpdateInventoryCategoryDto, userId: number) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const updatedCategory = await this.drizzle
      .update(schema.inventoriesCategories)
      .set({
        ...dto,
        updatedById: userId,
      })
      .where(eq(schema.inventoriesCategories.id, id))
      .returning();

    return {
      message: `Category with name ${updatedCategory[0].name} update`,
    };
  }

  async remove(id: number) {
    const exist = await this.findOne(id);

    if (!exist) {
      throw new NotFoundException(`Category not found`);
    }

    const isProductCategory = await this.drizzle.query.products.findFirst({
      where: eq(schema.products.categoryId, id),
    });

    if (isProductCategory) {
      throw new BadRequestException(
        'Cannot be deleted, Product Category is in use',
      );
    }

    const deletedCategory = await this.drizzle
      .delete(schema.inventoriesCategories)
      .where(eq(schema.inventoriesCategories.id, id))
      .returning();

    if (!deletedCategory.length) {
      throw new NotFoundException(`Category not delete`);
    }

    return {
      message: `Category with name ${deletedCategory[0].name} delete success`,
    };
  }
}
