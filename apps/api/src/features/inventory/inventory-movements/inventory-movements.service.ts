import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  inventoryMovementItems,
  inventoryMovements,
  products,
} from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from './dto/inventory-movements.schema';
import { InventoryMovementPaginationDto } from './dto/pagination-inventory-movement.dto';

type InventoryMovementSelect = typeof inventoryMovements.$inferSelect;

const INFLOW_TYPES = [
  'PURCHASE_RECEIPT',
  'CUSTOMER_RETURN',
  'INTERNAL_TRANSFER_IN',
  'INVENTORY_ADJUSTMENT_IN',
] as const;

const OUTFLOW_TYPES = [
  'SUPPLIER_RETURN',
  'STOCK_DELIVERY',
  'INTERNAL_TRANSFER_OUT',
  'INVENTORY_ADJUSTMENT_OUT',
  'STOCK_WASTE',
  'INTERNAL_CONSUMPTION',
] as const;

const ADJUST_TYPES = [
  'INVENTORY_ADJUSTMENT_IN',
  'INVENTORY_ADJUSTMENT_OUT',
] as const;

function getCodePrefix(movementType: string): string {
  if (INFLOW_TYPES.includes(movementType as (typeof INFLOW_TYPES)[number])) {
    return 'INV-IN';
  }
  if (ADJUST_TYPES.includes(movementType as (typeof ADJUST_TYPES)[number])) {
    return 'INV-ADJ';
  }
  return 'INV-OUT';
}

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
    const prefix = getCodePrefix(dto.movementType);
    const movementNumber = await this.generateCodeService.generateNextReference(
      prefix,
      tenantId,
      'inventory',
      'movements',
    );

    const db = tx || this.db;

    const result = await db.transaction(async (tx) => {
      const [movement] = await tx
        .insert(inventoryMovements)
        .values({
          tenantId,
          movementType:
            dto.movementType as (typeof inventoryMovements.$inferInsert)['movementType'],
          movementNumber,
          movementDate: dto.movementDate
            ? new Date(dto.movementDate)
            : new Date(),
          description: dto.description ?? null,
          status: 'completed',
          supplierId: dto.supplierId ?? null,
          invoiceNumber: dto.invoiceNumber ?? null,
          associateId: dto.associateId ?? null,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          creditId: dto.creditId ?? null,
          createdBy: userId,
          createdById: userId,
        })
        .returning();

      await tx.insert(inventoryMovementItems).values(
        dto.items.map((item) => ({
          movementId: movement.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: String(item.unitCost ?? 0),
          totalCost: String((item.unitCost ?? 0) * item.quantity),
        })),
      );

      if (
        INFLOW_TYPES.includes(dto.movementType as (typeof INFLOW_TYPES)[number])
      ) {
        const productIds = dto.items.map((i) => i.productId);
        await tx
          .update(products)
          .set({
            status: 'AVAILABLE' as (typeof products.$inferInsert)['status'],
          })
          .where(
            and(
              inArray(products.id, productIds),
              sql`${products.status} = 'COMMING_SOON'`,
              eq(products.tenantId, tenantId),
            ),
          );
      }

      return movement;
    });

    await this.auditHelper.logCreate(userId, 'inventory_movement', result, {
      tenantId,
      targetId: result.id,
      description: `Movimiento de inventario ${movementNumber} creado`,
    });

    return {
      message: 'Movimiento de inventario creado exitosamente',
      data: result,
    };
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: InventoryMovementPaginationDto,
  ): Promise<{
    data: Record<string, unknown>[];
    meta: Record<string, unknown>;
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      movementType,
      status,
      startDate,
      endDate,
      productId,
      supplierId,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        sql`(${ilike(inventoryMovements.movementNumber, `%${search}%`)} OR ${ilike(inventoryMovements.description, `%${search}%`)})`,
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

    if (status) {
      searchConditions.push(
        eq(
          inventoryMovements.status,
          status as 'draft' | 'completed' | 'cancelled',
        ),
      );
    }

    if (supplierId) {
      searchConditions.push(eq(inventoryMovements.supplierId, supplierId));
    }

    if (startDate && endDate) {
      searchConditions.push(
        sql`${inventoryMovements.movementDate} BETWEEN ${startDate} AND ${endDate}`,
      );
    } else if (startDate) {
      searchConditions.push(
        sql`${inventoryMovements.movementDate} >= ${startDate}`,
      );
    } else if (endDate) {
      searchConditions.push(
        sql`${inventoryMovements.movementDate} <= ${endDate}`,
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
      .select({
        id: inventoryMovements.id,
        tenantId: inventoryMovements.tenantId,
        movementNumber: inventoryMovements.movementNumber,
        movementType: inventoryMovements.movementType,
        movementDate: inventoryMovements.movementDate,
        status: inventoryMovements.status,
        description: inventoryMovements.description,
        supplierId: inventoryMovements.supplierId,
        invoiceNumber: inventoryMovements.invoiceNumber,
        associateId: inventoryMovements.associateId,
        purchaseOrderId: inventoryMovements.purchaseOrderId,
        createdAt: inventoryMovements.createdAt,
        updatedAt: inventoryMovements.updatedAt,
      })
      .from(inventoryMovements)
      .where(searchCondition)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMovements)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const movementIds = data.map((m) => m.id);

    let itemsMap: Record<string, Record<string, unknown>[]> = {};
    if (movementIds.length > 0) {
      const allItems = await this.db
        .select({
          id: inventoryMovementItems.id,
          movementId: inventoryMovementItems.movementId,
          productId: inventoryMovementItems.productId,
          productName: schema.products.name,
          productCode: schema.products.internalCode,
          quantity: inventoryMovementItems.quantity,
          unitCost: inventoryMovementItems.unitCost,
          totalCost: inventoryMovementItems.totalCost,
        })
        .from(inventoryMovementItems)
        .leftJoin(
          schema.products,
          eq(inventoryMovementItems.productId, schema.products.id),
        )
        .where(sql`${inventoryMovementItems.movementId} IN ${movementIds}`);

      itemsMap = allItems.reduce(
        (acc, item) => {
          const mId = item.movementId;
          if (!acc[mId]) acc[mId] = [];
          acc[mId].push({
            ...item,
            unitCost: Number(item.unitCost ?? 0),
            totalCost: Number(item.totalCost ?? 0),
          });
          return acc;
        },
        {} as Record<string, Record<string, unknown>[]>,
      );
    }

    const formattedData = data.map((m) => ({
      ...m,
      movementDate: m.movementDate
        ? new Date(m.movementDate as unknown as string)
            .toISOString()
            .split('T')[0]
        : null,
      createdAt: m.createdAt
        ? new Date(m.createdAt as unknown as string).toISOString()
        : null,
      updatedAt: m.updatedAt
        ? new Date(m.updatedAt as unknown as string).toISOString()
        : null,
      items: itemsMap[m.id] || [],
    }));

    const meta = {
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data: formattedData, meta };
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<Record<string, unknown>> {
    const conditions: SQL<unknown>[] = [eq(inventoryMovements.id, id)];

    if (tenantId) {
      conditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [movement] = await this.db
      .select({
        id: inventoryMovements.id,
        tenantId: inventoryMovements.tenantId,
        movementNumber: inventoryMovements.movementNumber,
        movementType: inventoryMovements.movementType,
        movementDate: inventoryMovements.movementDate,
        status: inventoryMovements.status,
        description: inventoryMovements.description,
        supplierId: inventoryMovements.supplierId,
        supplierName: schema.suppliers.name,
        invoiceNumber: inventoryMovements.invoiceNumber,
        associateId: inventoryMovements.associateId,
        purchaseOrderId: inventoryMovements.purchaseOrderId,
        creditId: inventoryMovements.creditId,
        accountingEntryId: inventoryMovements.accountingEntryId,
        originMovementId: inventoryMovements.originMovementId,
        createdBy: inventoryMovements.createdBy,
        updatedBy: inventoryMovements.updatedBy,
        cancelledBy: inventoryMovements.cancelledBy,
        cancelledAt: inventoryMovements.cancelledAt,
        createdAt: inventoryMovements.createdAt,
        updatedAt: inventoryMovements.updatedAt,
      })
      .from(inventoryMovements)
      .leftJoin(
        schema.suppliers,
        eq(inventoryMovements.supplierId, schema.suppliers.id),
      )
      .where(and(...conditions));

    if (!movement) {
      throw new NotFoundException('Movimiento de inventario no encontrado');
    }

    const items = await this.db
      .select({
        id: inventoryMovementItems.id,
        productId: inventoryMovementItems.productId,
        productName: schema.products.name,
        productCode: schema.products.internalCode,
        quantity: inventoryMovementItems.quantity,
        unitCost: inventoryMovementItems.unitCost,
        totalCost: inventoryMovementItems.totalCost,
        purchaseOrderItemId: inventoryMovementItems.purchaseOrderItemId,
      })
      .from(inventoryMovementItems)
      .leftJoin(
        schema.products,
        eq(inventoryMovementItems.productId, schema.products.id),
      )
      .where(eq(inventoryMovementItems.movementId, id));

    return {
      ...movement,
      movementDate: movement.movementDate
        ? new Date(movement.movementDate as unknown as string)
            .toISOString()
            .split('T')[0]
        : null,
      createdAt: movement.createdAt
        ? new Date(movement.createdAt as unknown as string).toISOString()
        : null,
      updatedAt: movement.updatedAt
        ? new Date(movement.updatedAt as unknown as string).toISOString()
        : null,
      cancelledAt: movement.cancelledAt
        ? new Date(movement.cancelledAt as unknown as string).toISOString()
        : null,
      items: items.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost ?? 0),
        totalCost: Number(item.totalCost ?? 0),
      })),
    };
  }

  async update(
    id: string,
    dto: UpdateInventoryMovementDto,
    tenantId: string | null,
    userId: string,
  ) {
    const existing = (await this.findOne(
      id,
      tenantId,
    )) as InventoryMovementSelect;

    if (existing.status === 'cancelled') {
      throw new BadRequestException(
        'No se puede editar un movimiento cancelado',
      );
    }

    const result = await this.db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedBy: userId,
        updatedById: userId,
      };

      if (dto.movementType !== undefined && dto.movementType !== null)
        updateData.movementType = dto.movementType;
      if (dto.description !== undefined && dto.description !== null)
        updateData.description = dto.description;
      if (dto.movementDate !== undefined && dto.movementDate !== null)
        updateData.movementDate = new Date(dto.movementDate);
      if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
      if (dto.invoiceNumber !== undefined)
        updateData.invoiceNumber = dto.invoiceNumber;
      if (dto.associateId !== undefined)
        updateData.associateId = dto.associateId;
      if (dto.purchaseOrderId !== undefined)
        updateData.purchaseOrderId = dto.purchaseOrderId;

      const whereConditions: SQL<unknown>[] = [eq(inventoryMovements.id, id)];
      if (tenantId) {
        whereConditions.push(eq(inventoryMovements.tenantId, tenantId));
      }

      const [updated] = await tx
        .update(inventoryMovements)
        .set(updateData)
        .where(and(...whereConditions))
        .returning();

      if (!updated) {
        throw new NotFoundException(
          'Movimiento de inventario no encontrado después de actualizar',
        );
      }

      if (dto.items !== undefined && dto.items !== null) {
        await tx
          .delete(inventoryMovementItems)
          .where(eq(inventoryMovementItems.movementId, id));

        if (dto.items.length > 0) {
          await tx.insert(inventoryMovementItems).values(
            dto.items.map((item) => ({
              movementId: updated.id,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: String(item.unitCost ?? 0),
              totalCost: String((item.unitCost ?? 0) * item.quantity),
            })),
          );
        }
      }

      return updated;
    });

    await this.auditHelper.logUpdate(
      userId,
      'inventory_movement',
      existing,
      result,
      {
        tenantId: existing.tenantId,
        targetId: result.id,
        description: `Movimiento de inventario ${result.movementNumber} actualizado`,
      },
    );

    return {
      message: 'Movimiento de inventario actualizado exitosamente',
      data: result,
    };
  }

  async cancel(id: string, tenantId: string | null, userId: string) {
    const existing = (await this.findOne(
      id,
      tenantId,
    )) as InventoryMovementSelect;

    if (existing.status === 'cancelled') {
      throw new BadRequestException('El movimiento ya está cancelado');
    }

    if (existing.status === 'completed') {
      throw new BadRequestException(
        'No se puede cancelar un movimiento completado',
      );
    }

    const whereConditions: SQL<unknown>[] = [eq(inventoryMovements.id, id)];
    if (tenantId) {
      whereConditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(inventoryMovements)
      .set({
        status:
          'cancelled' as (typeof inventoryMovements.$inferInsert)['status'],
        cancelledBy: userId,
        cancelledAt: new Date(),
      })
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException('Movimiento de inventario no encontrado');
    }

    await this.auditHelper.logUpdate(
      userId,
      'inventory_movement',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: id,
        description: `Movimiento de inventario ${updated.movementNumber} cancelado`,
      },
    );

    return {
      message: 'Movimiento de inventario cancelado exitosamente',
      data: updated,
    };
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
      sql`${inventoryMovements.status} = 'completed'`,
    ];

    if (tenantId) {
      conditions.push(eq(inventoryMovements.tenantId, tenantId));
    }

    const [stock] = await this.db
      .select({
        inflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('PURCHASE_RECEIPT','CUSTOMER_RETURN','INTERNAL_TRANSFER_IN','INVENTORY_ADJUSTMENT_IN') THEN ${inventoryMovementItems.quantity} ELSE 0 END), 0)`,
        outflow: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('SUPPLIER_RETURN','STOCK_DELIVERY','INTERNAL_TRANSFER_OUT','INVENTORY_ADJUSTMENT_OUT','STOCK_WASTE','INTERNAL_CONSUMPTION') THEN ${inventoryMovementItems.quantity} ELSE 0 END), 0)`,
      })
      .from(inventoryMovementItems)
      .innerJoin(
        inventoryMovements,
        eq(inventoryMovementItems.movementId, inventoryMovements.id),
      )
      .where(and(...conditions));

    const inflow = stock?.inflow ?? 0;
    const outflow = stock?.outflow ?? 0;
    const currentQuantity = inflow - outflow;

    return {
      currentQuantity,
      availableQuantity: currentQuantity,
    };
  }
}
