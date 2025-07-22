import { inventoryMovements } from '@/database/schema/administration';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { FilterInventoryMovementDto } from './dto/filter-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateInventoryMovementDto) {
    const newMovement = await this.drizzle
      .insert(inventoryMovements)
      .values({
        ...data,
        createdById: userId,
      })
      .returning();

    return newMovement[0];
  }

  async findAll(paginationDto: FilterInventoryMovementDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      productId,
      movementType,
      documentType,
      documentNumber,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(inventoryMovements.notes, `%${search}%`));
    }
    if (productId) {
      searchConditions.push(eq(inventoryMovements.productId, productId));
    }
    if (movementType) {
      searchConditions.push(eq(inventoryMovements.movementType, movementType as any));
    }
    if (documentType) {
      searchConditions.push(ilike(inventoryMovements.documentType, `%${documentType}%`));
    }
    if (documentNumber) {
      searchConditions.push(ilike(inventoryMovements.documentNumber, `%${documentNumber}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${inventoryMovements[sortBy as keyof typeof inventoryMovements]} asc`
        : sql`${inventoryMovements[sortBy as keyof typeof inventoryMovements]} desc`;

    const data = await this.drizzle.query.inventoryMovements.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: {
        product: true,
      },
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMovements)
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
      },
    });

    if (!data) {
      throw new NotFoundException('Inventory movement not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateInventoryMovementDto) {
    const exist = await this.drizzle.query.inventoryMovements.findFirst({
      where: eq(inventoryMovements.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Inventory movement not found');
    }

    const updatedMovement = await this.drizzle
      .update(inventoryMovements)
      .set({
        ...data,
        updatedById: userId,
      })
      .where(eq(inventoryMovements.id, id))
      .returning();

    return updatedMovement[0];
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.inventoryMovements.findFirst({
      where: eq(inventoryMovements.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Inventory movement not found');
    }

    await this.drizzle.delete(inventoryMovements).where(eq(inventoryMovements.id, id));

    return { message: 'Inventory movement removed successfully' };
  }
}
