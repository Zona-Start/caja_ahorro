import { generateUniqueReference } from '@/common/utils/reference';
import { inventoryMovements } from '@/database/schema/administration';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { fixedAssets, products } from 'src/database/schema/administration';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { FilterInventoryMovementDto } from './dto/filter-inventory-movement.dto';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: number,
    data: CreateInventoryMovementDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const {
      items,
      description,
      movementType,
      documentType,
      documentNumber,
      notes,
      supplierInvoiceId,
    } = data;

    // if (documentType && documentNumber) {
    //   const existingMovement = await db.query.inventoryMovements.findFirst({
    //     where: and(
    //       eq(inventoryMovements.documentType, documentType),
    //       eq(inventoryMovements.documentNumber, documentNumber),
    //     ),
    //   });

    //   if (existingMovement) {
    //     throw new ConflictException(
    //       'An inventory movement with this document type and number already exists.',
    //     );
    //   }
    // }

    const newMovements = await db.transaction(async (tx) => {
      type MovementReturnType = {
        id: number;
        itemId: number;
        itemType: 'FIXED_ASSET' | 'PRODUCT';
        quantity: number;
        unitCost: string | null;
        movementType:
          | 'RECEIVED'
          | 'IN'
          | 'OUT'
          | 'ADJUST_IN'
          | 'ADJUST_OUT'
          | 'TRANSFER'
          | 'COMMIT'
          | 'UN_COMMIT'
          | 'ORDERED';
        documentType: string | null;
        documentNumber: string | null;
        notes: string | null;
        movementNumber: string;
      };
      const insertedMovements: MovementReturnType[] = [];
      for (const item of items) {
        const referenceId = generateUniqueReference();
        const newMovement = await tx
          .insert(inventoryMovements)
          .values({
            itemId: item.itemId,
            itemType: item.itemType,
            quantity: item.quantity,
            description: description,
            unitCost:
              item.unitCost !== undefined ? String(item.unitCost) : undefined,
            movementType: movementType,
            documentType: documentType,
            documentNumber: documentNumber,
            notes: notes,
            movementNumber: referenceId,
            createdById: userId,
            supplierInvoiceId: supplierInvoiceId,
          })
          .returning({
            id: inventoryMovements.id,
            itemId: inventoryMovements.itemId,
            itemType: inventoryMovements.itemType,
            quantity: inventoryMovements.quantity,
            unitCost: inventoryMovements.unitCost,
            movementType: inventoryMovements.movementType,
            documentType: inventoryMovements.documentType,
            documentNumber: inventoryMovements.documentNumber,
            notes: inventoryMovements.notes,
            movementNumber: inventoryMovements.movementNumber,
          });
        insertedMovements.push(newMovement[0]);
      }
      return insertedMovements;
    });

    return newMovements;
  }

  async findAll(paginationDto: FilterInventoryMovementDto) {
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
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        sql`(${ilike(products.name, `%${search}%`)} OR ${ilike(fixedAssets.name, `%${search}%`)})`,
      );
    }
    if (itemId) {
      searchConditions.push(eq(inventoryMovements.itemId, itemId));
    }
    if (itemType) {
      searchConditions.push(eq(inventoryMovements.itemType, itemType));
    }
    if (movementType) {
      searchConditions.push(
        eq(inventoryMovements.movementType, movementType as any),
      );
    }
    if (documentType) {
      searchConditions.push(
        ilike(inventoryMovements.documentType, `%${documentType}%`),
      );
    }
    if (documentNumber) {
      searchConditions.push(
        ilike(inventoryMovements.documentNumber, `%${documentNumber}%`),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${inventoryMovements[sortBy as keyof typeof inventoryMovements]} asc`
        : sql`${inventoryMovements[sortBy as keyof typeof inventoryMovements]} desc`;

    const data = await this.drizzle
      .select({
        id: inventoryMovements.id,
        itemId: inventoryMovements.itemId,
        itemType: inventoryMovements.itemType,
        quantity: inventoryMovements.quantity,
        unitCost: inventoryMovements.unitCost,
        movementType: inventoryMovements.movementType,
        documentType: inventoryMovements.documentType,
        description: inventoryMovements.description,
        documentNumber: inventoryMovements.documentNumber,
        notes: inventoryMovements.notes,
        movementNumber: inventoryMovements.movementNumber,
        movementDate: inventoryMovements.movementDate,
        productName: sql<
          string | null
        >`CASE WHEN ${inventoryMovements.itemType} = 'PRODUCT' THEN ${products.name} ELSE NULL END`.as(
          'productName',
        ),
        fixedAssetName: sql<
          string | null
        >`CASE WHEN ${inventoryMovements.itemType} = 'FIXED_ASSET' THEN ${fixedAssets.name} ELSE NULL END`.as(
          'fixedAssetName',
        ),
      })
      .from(inventoryMovements)
      .leftJoin(products, eq(inventoryMovements.itemId, products.id))
      .leftJoin(fixedAssets, eq(inventoryMovements.itemId, fixedAssets.id))
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMovements)
      .leftJoin(products, eq(inventoryMovements.itemId, products.id))
      .leftJoin(fixedAssets, eq(inventoryMovements.itemId, fixedAssets.id))
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

  async findOne(id: number) {
    const data = await this.drizzle.query.inventoryMovements.findFirst({
      where: eq(inventoryMovements.id, id),
      with: {
        product: true,
        fixedAsset: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Inventory movement not found');
    }

    return data;
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.inventoryMovements.findFirst({
      where: eq(inventoryMovements.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Inventory movement not found');
    }

    await this.drizzle
      .delete(inventoryMovements)
      .where(eq(inventoryMovements.id, id));

    return { message: 'Inventory movement removed successfully' };
  }

  async getItemStock(itemId: number, itemType: 'PRODUCT' | 'FIXED_ASSET') {
    const stock = await this.drizzle
      .select({
        inflow: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('IN', 'ADJUST_IN', 'RECEIVED') THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        outflow: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} IN ('OUT', 'ADJUST_OUT') THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        committed: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'COMMIT' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        uncommitted: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'UN_COMMIT' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        ordered: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'ORDERED' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
        received: sql<string>`COALESCE(SUM(CASE WHEN ${inventoryMovements.movementType} = 'RECEIVED' THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.itemId, itemId),
          eq(inventoryMovements.itemType, itemType),
        ),
      );

    const { inflow, outflow, committed, uncommitted, ordered, received } =
      stock[0];

    const currentQuantity = Number(inflow) - Number(outflow);
    const committedQuantity = Number(committed) - Number(uncommitted);
    const orderedQuantity = Number(ordered) - Number(received);
    const availableQuantity = currentQuantity - committedQuantity;

    return {
      currentQuantity,
      committedQuantity,
      orderedQuantity,
      availableQuantity,
    };
  }
}
