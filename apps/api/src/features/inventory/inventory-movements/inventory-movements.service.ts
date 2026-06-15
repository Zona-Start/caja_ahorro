import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { inventoryMovementItems, inventoryMovements } from '@/database/schema/tables/inventory';
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
  ) {
    const movementNumber = await this.generateCodeService.generateNextReference(
      'DOC_INV',
      tenantId,
      'inventory',
      'stock_movements',
    );

    const currentTx = tx || this.db;

    const result = await currentTx.transaction(async (tx) => {
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          tenantId,
          movementType: dto.movementType as any,
          movementNumber,
          description: dto.description ?? null,
          createdById: userId,
        })
        .returning();

      if (dto.items.length > 0) {
        await tx.insert(inventoryMovementItems).values(
          dto.items.map((item) => ({
            movementId: movement.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: (item.unitCost ?? 0).toString(),
            totalCost: ((item.unitCost ?? 0) * item.quantity).toString(),
          })),
        );
      }

      return movement;
    });

    await this.auditHelper.logCreate(userId, 'inventory_movement', result, {
      tenantId,
      targetId: result.id,
      description: `Created inventory movement ${movementNumber}`,
    });

    return result;
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
      productId,
      movementType,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(inventoryMovements.description, `%${search}%`),
      );
    }

    if (movementType) {
      searchConditions.push(
        eq(
          inventoryMovements.movementType,
          movementType as (typeof inventoryMovements.$inferInsert)['movementType'],
        ),
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
    productId: string,
    tenantId: string | null,
  ): Promise<{
    currentQuantity: number;
    availableQuantity: number;
  }> {
    const conditions: SQL<unknown>[] = [
      eq(inventoryMovementItems.productId, productId),
    ];

    if (tenantId) {
      conditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [stock] = await this.db
      .select({
        inflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('PURCHASE_RECEIPT','CUSTOMER_RETURN','INTERNAL_TRANSFER_IN','INVENTORY_ADJUSTMENT_IN','PRODUCTION_OUTPUT') THEN ${inventoryMovementItems.quantity} ELSE 0 END), 0)`,
        outflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('SUPPLIER_RETURN','STOCK_DELIVERY','INTERNAL_TRANSFER_OUT','INVENTORY_ADJUSTMENT_OUT','STOCK_WASTE','INTERNAL_CONSUMPTION','PRODUCTION_CONSUMPTION') THEN ${inventoryMovementItems.quantity} ELSE 0 END), 0)`,
      })
      .from(inventoryMovementItems)
      .innerJoin(inventoryMovements, eq(inventoryMovementItems.movementId, inventoryMovements.id))
      .where(and(...conditions));

    const inflow = stock?.inflow ?? 0;
    const outflow = stock?.outflow ?? 0;

    const currentQuantity = inflow - outflow;
    const availableQuantity = currentQuantity;

    return {
      currentQuantity,
      availableQuantity,
    };
  }
}
