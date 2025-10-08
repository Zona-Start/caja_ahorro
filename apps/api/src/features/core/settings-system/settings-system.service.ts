import { systemSettings } from '@/database/schema/tables';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { FilterSettingTypeDto } from './dto/filter-setting-type.dto';
import { UpdateSettingSystemDto } from './dto/update-setting-system.dto';
import { SettingSystem } from './entities/settings-system.entity';

@Injectable()
export class SettingsSystemService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<SettingSystem[]> {
    return await this.drizzle.select().from(systemSettings);
  }

  async findAllByGroup(
    filterSettingTypeDto?: FilterSettingTypeDto,
  ): Promise<{ data: SettingSystem[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      type = '',
      group = 'ALL',
    } = filterSettingTypeDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;
    // Build search condition
    let searchCondition: SQL<unknown> | undefined;

    if (group === 'DOCUMENTS') {
      searchCondition = eq(systemSettings.group, group);
    } else if (group === 'ALL') {
      searchCondition = sql`${systemSettings.group} != 'DOCUMENTS'`;
    }

    if (type) {
      const typeFilter = eq(systemSettings.group, type);
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${typeFilter}`
        : typeFilter;
    }

    if (search) {
      const searchFilter = ilike(systemSettings.description, `%${search}%`);
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${searchFilter}`
        : searchFilter;
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${systemSettings[sortBy as keyof typeof systemSettings]} asc`
        : sql`${systemSettings[sortBy as keyof typeof systemSettings]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(systemSettings)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: systemSettings.id,
        key: systemSettings.key,
        description: systemSettings.description,
        value: systemSettings.value,
        group: systemSettings.group,
      })
      .from(systemSettings)
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

  async findOne(id: number): Promise<SettingSystem> {
    const result = await this.drizzle
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, id));

    if (!result.length) {
      throw new NotFoundException(`Settings with ID ${id} not found`);
    }

    return result[0];
  }

  async findKey(key: string): Promise<SettingSystem> {
    const result = await this.drizzle
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));

    if (!result.length) {
      throw new NotFoundException(`Settings with ID ${key} not found`);
    }

    return result[0];
  }

  async update(
    id: number,
    updateSettingSystemDto: UpdateSettingSystemDto,
  ): Promise<SettingSystem> {
    const existingSetting = await this.findOne(id);

    if (!existingSetting) {
      throw new NotFoundException(`Settings System not found`);
    }

    const result = await this.drizzle
      .update(systemSettings)
      .set({
        ...updateSettingSystemDto,
      })
      .where(eq(systemSettings.id, id))
      .returning();

    return result[0];
  }
}
