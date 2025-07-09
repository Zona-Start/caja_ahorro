import { fixedAssetMaintenances } from '@/database/schema/inventory';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateFixedAssetsMaintenanceDto } from './dto/create-fixed-assets-maintenance.dto';
import { FilterFixedAssetsMaintenanceDto } from './dto/filter-fixed-assets-maintenance.dto';
import { UpdateFixedAssetsMaintenanceDto } from './dto/update-fixed-assets-maintenance.dto';

@Injectable()
export class FixedAssetsMaintenancesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, dto: CreateFixedAssetsMaintenanceDto) {
    try {
      // Optionally, validate assetId exists (not implemented here)
      // const exist = await this.drizzle.query.fixedAssetMaintenances.findFirst({
      //   where: eq(fixedAssetMaintenances.assetId, dto.assetId),
      // });
      // if (exist) {
      //   throw new NotFoundException('Fixed asset maintenance not found');
      // }
      const maintenanceData = {
        ...dto,
        maintenanceDate:
          dto.maintenanceDate instanceof Date
            ? dto.maintenanceDate.toISOString()
            : dto.maintenanceDate,
        cost: dto.cost?.toString() ?? '0.00',
        createdById: userId,
      };
      const result = await this.drizzle
        .insert(fixedAssetMaintenances)
        .values(maintenanceData)
        .returning();
      return {
        message: 'Fixed asset maintenance created successfully',
        data: result[0],
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create maintenance');
    }
  }

  async findAll(filterDto: FilterFixedAssetsMaintenanceDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'id',
        sortOrder = 'asc',
        assetId,
        maintenanceType,
        startDate,
        endDate,
      } = filterDto;
      const offset = (page - 1) * limit;
      let searchConditions: SQL<unknown>[] = [];
      if (search) {
        searchConditions.push(
          sql`(${ilike(fixedAssetMaintenances.description, `%${search}%`)} OR ${ilike(fixedAssetMaintenances.maintenanceType, `%${search}%`)} OR ${ilike(fixedAssetMaintenances.performedBy, `%${search}%`)})`,
        );
      }
      if (assetId) {
        searchConditions.push(eq(fixedAssetMaintenances.assetId, assetId));
      }
      if (maintenanceType) {
        searchConditions.push(
          ilike(fixedAssetMaintenances.maintenanceType, `%${maintenanceType}%`),
        );
      }
      if (startDate && endDate) {
        searchConditions.push(
          sql`${fixedAssetMaintenances.maintenanceDate} BETWEEN ${startDate} AND ${endDate}`,
        );
      } else if (startDate) {
        searchConditions.push(
          sql`${fixedAssetMaintenances.maintenanceDate} >= ${startDate}`,
        );
      } else if (endDate) {
        searchConditions.push(
          sql`${fixedAssetMaintenances.maintenanceDate} <= ${endDate}`,
        );
      }
      const searchCondition = searchConditions.length
        ? and(...searchConditions)
        : undefined;
      const orderBy =
        sortOrder === 'asc'
          ? sql`${fixedAssetMaintenances[sortBy as keyof typeof fixedAssetMaintenances]} asc`
          : sql`${fixedAssetMaintenances[sortBy as keyof typeof fixedAssetMaintenances]} desc`;
      const totalCountResult = await this.drizzle
        .select({ count: sql<number>`count(*)` })
        .from(fixedAssetMaintenances)
        .where(searchCondition);
      const totalCount = Number(totalCountResult[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      const data = await this.drizzle
        .select()
        .from(fixedAssetMaintenances)
        .where(searchCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch maintenances');
    }
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.fixedAssetMaintenances.findFirst({
      where: eq(fixedAssetMaintenances.id, id),
    });
    if (!data) {
      throw new NotFoundException('Fixed asset maintenance not found');
    }
    return data;
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateFixedAssetsMaintenanceDto,
  ) {
    const exist = await this.drizzle.query.fixedAssetMaintenances.findFirst({
      where: eq(fixedAssetMaintenances.id, id),
    });
    if (!exist) {
      throw new NotFoundException('Fixed asset maintenance not found');
    }
    await this.drizzle
      .update(fixedAssetMaintenances)
      .set({
        ...dto,
        updatedById: userId,
        maintenanceDate: dto.maintenanceDate?.toISOString(),
      })
      .where(eq(fixedAssetMaintenances.id, id));
    return 'Fixed asset maintenance updated successfully';
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.fixedAssetMaintenances.findFirst({
      where: eq(fixedAssetMaintenances.id, id),
    });
    if (!exist) {
      throw new NotFoundException('Fixed asset maintenance not found');
    }
    await this.drizzle
      .delete(fixedAssetMaintenances)
      .where(eq(fixedAssetMaintenances.id, id));
    return 'Fixed asset maintenance removed successfully';
  }
}
