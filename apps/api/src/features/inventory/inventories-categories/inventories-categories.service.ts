import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { inventoriesCategories } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateInventoryCategoryDto } from './dto/inventories-categories.schema';
import { UpdateInventoryCategoryDto } from './dto/inventories-categories.schema';
import { InventoryCategoryPaginationDto } from './dto/pagination-inventory-category.dto';

type InventoryCategorySelect = typeof inventoriesCategories.$inferSelect;

@Injectable()
export class InventoriesCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateInventoryCategoryDto,
    tenantId: string,
    userId: string,
  ): Promise<InventoryCategorySelect> {
    const [existing] = await this.db
      .select()
      .from(inventoriesCategories)
      .where(
        and(
          eq(inventoriesCategories.name, dto.name),
          eq(inventoriesCategories.tenantId, tenantId),
        ),
      );

    if (existing) {
      throw new BadRequestException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    const [created] = await this.db
      .insert(inventoriesCategories)
      .values({
        tenantId,
        name: dto.name,
        group: dto.group,
        description: dto.description ?? null,
        createdById: userId,
      })
      .returning();

    await this.auditHelper.logCreate(userId, 'inventory_category', created, {
      tenantId,
      targetId: created.id,
      description: `Created inventory category ${created.name}`,
    });

    return created;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: InventoryCategoryPaginationDto,
  ): Promise<{ data: InventoryCategorySelect[]; meta: Record<string, unknown> }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchType = '',
      sortBy = 'id',
      sortOrder = 'asc',
      group,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'name':
          searchConditions.push(
            ilike(inventoriesCategories.name, `%${search}%`),
          );
          break;
        case 'group':
          searchConditions.push(
            ilike(inventoriesCategories.group, `%${search}%`),
          );
          break;
        default:
          searchConditions.push(
            ilike(inventoriesCategories.name, `%${search}%`),
          );
          break;
      }
    }

    if (group) {
      searchConditions.push(eq(inventoriesCategories.group, group));
    }

    if (tenantId) {
      searchConditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn =
      inventoriesCategories[sortBy as keyof typeof inventoriesCategories];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoriesCategories)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(inventoriesCategories)
      .where(searchCondition)
      .orderBy(orderByClause)
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
  }

  async findAll(tenantId: string | null): Promise<InventoryCategorySelect[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    return this.db
      .select()
      .from(inventoriesCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${inventoriesCategories.createdAt} desc`);
  }

  async findAllByGroup(
    group: string,
    tenantId: string | null,
  ): Promise<InventoryCategorySelect[]> {
    const conditions: SQL<unknown>[] = [
      eq(inventoriesCategories.group, group),
    ];

    if (tenantId) {
      conditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    return this.db
      .select()
      .from(inventoriesCategories)
      .where(and(...conditions))
      .orderBy(sql`${inventoriesCategories.name} asc`);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<InventoryCategorySelect> {
    const conditions = [eq(inventoriesCategories.id, id)];

    if (tenantId) {
      conditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    const [result] = await this.db
      .select()
      .from(inventoriesCategories)
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException(
        `Inventory category with ID ${id} not found`,
      );
    }

    return result;
  }

  async update(
    id: string,
    dto: UpdateInventoryCategoryDto,
    tenantId: string | null,
    userId: string,
  ): Promise<InventoryCategorySelect> {
    const existing = await this.findOne(id, tenantId);

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.db
        .select()
        .from(inventoriesCategories)
        .where(
          and(
            eq(inventoriesCategories.name, dto.name),
            eq(inventoriesCategories.tenantId, existing.tenantId),
          ),
        );

      if (duplicate.length > 0) {
        throw new BadRequestException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedById: userId,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.group !== undefined) updateData.group = dto.group;
    if (dto.description !== undefined)
      updateData.description = dto.description;

    const whereConditions = [eq(inventoriesCategories.id, id)];
    if (tenantId) {
      whereConditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(inventoriesCategories)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException(
        `Inventory category with ID ${id} not found after update`,
      );
    }

    await this.auditHelper.logUpdate(
      userId,
      'inventory_category',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: updated.id,
        description: `Updated inventory category ${updated.name}`,
      },
    );

    return updated;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);

    const whereConditions = [eq(inventoriesCategories.id, id)];
    if (tenantId) {
      whereConditions.push(eq(inventoriesCategories.tenantId, tenantId));
    }

    await this.db
      .delete(inventoriesCategories)
      .where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'inventory_category', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted inventory category ${existing.name}`,
    });
  }
}
