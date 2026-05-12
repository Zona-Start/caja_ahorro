import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { inventoryMovements } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateInventoryMovementDto } from './dto/inventory-movements.schema';
import { InventoryMovementPaginationDto } from './dto/pagination-inventory-movement.dto';

type InventoryMovementSelect = typeof inventoryMovements.$inferSelect;

@Injectable()
export class InventoryMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateInventoryMovementDto,
    tenantId: string,
    userId: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<InventoryMovementSelect[]> {
    const transactionTypes =
      dto.movementType === 'IN'
        ? 'DOC_INV_ENT'
        : dto.movementType === 'OUT'
          ? 'DOC_INV_SAL'
          : 'DOC_INV_AJU';

    const subModuleType =
      dto.movementType === 'IN'
        ? 'stock_entries'
        : dto.movementType === 'OUT'
          ? 'stock_outputs'
          : 'stock_adjustments';

    const movementNumber = await this.generateCodeService.generateNextReference(
      transactionTypes,
      tenantId,
      'inventory',
      subModuleType,
    );

    const results: InventoryMovementSelect[] = [];

    const currentTx = tx || this.db;

    await currentTx.transaction(async (tx) => {
      for (const item of dto.items) {
        const [inserted] = await tx
          .insert(inventoryMovements)
          .values({
            tenantId,
            itemId: parseInt(item.itemId, 10),
            itemType: item.itemType,
            movementType: dto.movementType,
            quantity: item.quantity,
            unitCost: item.unitCost?.toString() ?? null,
            description: dto.description ?? null,
            documentType: dto.documentType ?? null,
            documentNumber: dto.documentNumber ?? null,
            notes: dto.notes ?? null,
            movementNumber,
            supplierInvoiceId: dto.supplierInvoiceId ?? null,
            createdById: userId,
          })
          .returning();

        results.push(inserted);
      }
    });

    await this.auditHelper.logCreate(userId, 'inventory_movement', results[0], {
      tenantId,
      targetId: results[0].id,
      description: `Created inventory movement ${movementNumber} with ${results.length} items`,
    });

    return results;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: InventoryMovementPaginationDto,
  ): Promise<{
    data: InventoryMovementSelect[];
    meta: Record<string, unknown>;
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      itemId,
      itemType,
      movementType,
      documentType,
      documentNumber,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(inventoryMovements.description, `%${search}%`),
      );
    }

    if (itemId) {
      searchConditions.push(
        eq(inventoryMovements.itemId, parseInt(itemId, 10)),
      );
    }

    if (itemType) {
      searchConditions.push(eq(inventoryMovements.itemType, itemType));
    }

    if (movementType) {
      searchConditions.push(
        eq(
          inventoryMovements.movementType,
          movementType as (typeof inventoryMovements.$inferInsert)['movementType'],
        ),
      );
    }

    if (documentType) {
      searchConditions.push(eq(inventoryMovements.documentType, documentType));
    }

    if (documentNumber) {
      searchConditions.push(
        eq(inventoryMovements.documentNumber, documentNumber),
      );
    }

    if (tenantId) {
      searchConditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn =
      inventoryMovements[sortBy as keyof typeof inventoryMovements];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
      .select()
      .from(inventoryMovements)
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMovements)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

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

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<InventoryMovementSelect> {
    const conditions = [eq(inventoryMovements.id, id)];

    if (tenantId) {
      conditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [result] = await this.db
      .select()
      .from(inventoryMovements)
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException('Inventory movement not found');
    }

    return result;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);

    const whereConditions = [eq(inventoryMovements.id, id)];
    if (tenantId) {
      whereConditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    await this.db.delete(inventoryMovements).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'inventory_movement', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted inventory movement ${existing.movementNumber}`,
    });
  }

  async getItemStock(
    itemId: string,
    itemType: 'PRODUCT' | 'FIXED_ASSET',
    tenantId: string | null,
  ): Promise<{
    currentQuantity: number;
    committedQuantity: number;
    orderedQuantity: number;
    availableQuantity: number;
  }> {
    const conditions: SQL<unknown>[] = [
      eq(inventoryMovements.itemId, parseInt(itemId, 10)),
      eq(inventoryMovements.itemType, itemType),
    ];

    if (tenantId) {
      conditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [stock] = await this.db
      .select({
        inflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('IN', 'ADJUST_IN', 'RECEIVED') THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        outflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('OUT', 'ADJUST_OUT') THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        committed: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'COMMIT' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        uncommitted: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'UN_COMMIT' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        ordered: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'ORDERED' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        received: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'RECEIVED' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
      })
      .from(inventoryMovements)
      .where(and(...conditions));

    const inflow = stock?.inflow ?? 0;
    const outflow = stock?.outflow ?? 0;
    const committed = stock?.committed ?? 0;
    const uncommitted = stock?.uncommitted ?? 0;
    const ordered = stock?.ordered ?? 0;
    const received = stock?.received ?? 0;

    const currentQuantity = inflow - outflow;
    const committedQuantity = committed - uncommitted;
    const orderedQuantity = ordered - received;
    const availableQuantity = currentQuantity - committedQuantity;

    return {
      currentQuantity,
      committedQuantity,
      orderedQuantity,
      availableQuantity,
    };
  }
}
