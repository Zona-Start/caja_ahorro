import { fixedAssetCategories } from '@/database/schema/inventory';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateFixedAssetCategoryDto } from './dto/create-fixed-assets-category.dto';
import { UpdateFixedAssetsCategoryDto } from './dto/update-fixed-assets-category.dto';

@Injectable()
export class FixedAssetCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateFixedAssetCategoryDto) {
    const exist = await this.drizzle.query.fixedAssetCategories.findFirst({
      where: eq(fixedAssetCategories.name, data.name),
    });

    if (exist) {
      throw new BadRequestException(
        'Fixed asset category with this name already exists',
      );
    }

    await this.drizzle
      .insert(fixedAssetCategories)
      .values({ ...data, createdById: userId });

    return {
      message: 'Fixed asset category created successfully',
    };
  }

  async findAll(paginationDto: any) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchCondition: SQL<unknown> | undefined = undefined;
    if (search) {
      searchCondition = ilike(fixedAssetCategories.name, `%${search}%`);
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${fixedAssetCategories[sortBy]} asc`
        : sql`${fixedAssetCategories[sortBy]} desc`;

    const data = await this.drizzle.query.fixedAssetCategories.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssetCategories)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findAllCategories() {
    return await this.drizzle
      .select({
        id: schema.fixedAssetCategories.id,
        name: schema.fixedAssetCategories.name,
      })
      .from(schema.fixedAssetCategories);
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.fixedAssetCategories.findFirst({
      where: eq(fixedAssetCategories.id, id),
    });

    if (!data) {
      throw new NotFoundException('Fixed asset category not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateFixedAssetsCategoryDto) {
    const exist = await this.drizzle.query.fixedAssetCategories.findFirst({
      where: eq(fixedAssetCategories.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Fixed asset category not found');
    }

    await this.drizzle
      .update(fixedAssetCategories)
      .set({ ...data, updatedById: userId })
      .where(eq(fixedAssetCategories.id, id));

    return {
      message: 'Fixed asset category updated successfully',
    };
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.fixedAssetCategories.findFirst({
      where: eq(fixedAssetCategories.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Fixed asset category not found');
    }

    await this.drizzle
      .delete(fixedAssetCategories)
      .where(eq(fixedAssetCategories.id, id));

    return {
      message: 'Fixed asset category removed successfully',
    };
  }
}
