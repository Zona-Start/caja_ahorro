import {
  salesProductPurchases,
  salesProducts,
} from '@/database/schema/inventory';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateSalesProductPurchaseDto } from './dto/create-sales-product-purchase.dto';
import { FilterSalesProductPurchaseDto } from './dto/filter-sales-product-purchase.dto';
import { UpdateSalesProductPurchaseDto } from './dto/update-sales-product-purchase.dto';
import { SalesProductPurchase } from './entities/sales-product-purchase.entity';

@Injectable()
export class SalesProductPurchasesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: number,
    createSalesProductPurchaseDto: CreateSalesProductPurchaseDto,
  ) {
    try {
      return await this.drizzle.transaction(async (tx) => {
        // Verificar que el producto existe
        const product = await tx.query.salesProducts.findFirst({
          where: eq(salesProducts.id, createSalesProductPurchaseDto.productId),
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${createSalesProductPurchaseDto.productId} not found`,
          );
        }

        // Calcular el costo total si no se proporciona
        let totalCost = createSalesProductPurchaseDto.totalCost;
        if (!totalCost) {
          totalCost =
            createSalesProductPurchaseDto.quantity *
            createSalesProductPurchaseDto.unitCost;
        }

        // Crear la compra
        const insertPurchase = await tx
          .insert(salesProductPurchases)
          .values({
            ...createSalesProductPurchaseDto,
            purchaseDate:
              createSalesProductPurchaseDto.purchaseDate.toISOString(),
            totalCost: totalCost.toString(),
            unitCost: createSalesProductPurchaseDto.unitCost.toString(),
            createdById: userId,
          })
          .returning();

        // Actualizar el stock del producto
        await tx
          .update(salesProducts)
          .set({
            currentStock: sql`${salesProducts.currentStock} + ${createSalesProductPurchaseDto.quantity}`,
          })
          .where(eq(salesProducts.id, createSalesProductPurchaseDto.productId));

        return insertPurchase[0];
      });
    } catch (error) {
      console.error('Error creating sales product purchase:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create sales product purchase',
      );
    }
  }

  async findAll(
    paginationDto: FilterSalesProductPurchaseDto,
  ): Promise<{ data: SalesProductPurchase[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      productId,
      startDate,
      endDate,
      supplierName,
      invoiceReference,
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search conditions
    let searchConditions: SQL<unknown>[] = [];

    if (productId) {
      searchConditions.push(eq(salesProductPurchases.productId, productId));
    }

    if (startDate) {
      searchConditions.push(
        gte(salesProductPurchases.purchaseDate, startDate.toISOString()),
      );
    }

    if (endDate) {
      searchConditions.push(
        lte(salesProductPurchases.purchaseDate, endDate.toISOString()),
      );
    }

    if (supplierName) {
      searchConditions.push(
        eq(salesProductPurchases.supplierName, supplierName),
      );
    }

    if (invoiceReference) {
      searchConditions.push(
        eq(salesProductPurchases.invoiceReference, invoiceReference),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${salesProductPurchases[sortBy as keyof typeof salesProductPurchases]} asc`
        : sql`${salesProductPurchases[sortBy as keyof typeof salesProductPurchases]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(salesProductPurchases)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data: SalesProductPurchase[] = await this.drizzle
      .select()
      .from(salesProductPurchases)
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

  async findOne(id: number) {
    const purchase = await this.drizzle
      .select()
      .from(salesProductPurchases)
      .where(eq(salesProductPurchases.id, id));

    if (!purchase.length) {
      throw new NotFoundException(
        `Sales product purchase with ID ${id} not found`,
      );
    }

    return purchase[0];
  }

  async update(
    userId: number,
    id: number,
    updateSalesProductPurchaseDto: UpdateSalesProductPurchaseDto,
  ) {
    try {
      return await this.drizzle.transaction(async (tx) => {
        // Verificar que la compra existe
        const existingPurchase = await tx.query.salesProductPurchases.findFirst(
          {
            where: eq(salesProductPurchases.id, id),
          },
        );

        if (!existingPurchase) {
          throw new NotFoundException(
            `Sales product purchase with ID ${id} not found`,
          );
        }

        // Si se cambia la cantidad, actualizar el stock del producto
        if (
          updateSalesProductPurchaseDto.quantity &&
          updateSalesProductPurchaseDto.quantity !== existingPurchase.quantity
        ) {
          const quantityDifference =
            updateSalesProductPurchaseDto.quantity -
            Number(existingPurchase.quantity);

          await tx
            .update(salesProducts)
            .set({
              currentStock: sql`${salesProducts.currentStock} + ${quantityDifference}`,
            })
            .where(eq(salesProducts.id, existingPurchase.productId));
        }

        // Actualizar la compra
        const updateData: any = {
          ...updateSalesProductPurchaseDto,
          updatedById: userId,
        };

        // Convertir fechas a formato ISO string
        if (updateData.purchaseDate) {
          updateData.purchaseDate = updateData.purchaseDate.toISOString();
        }

        // Convertir números a string para campos numéricos
        if (updateData.unitCost !== undefined) {
          updateData.unitCost = updateData.unitCost.toString();
        }

        if (updateData.totalCost !== undefined) {
          updateData.totalCost = updateData.totalCost.toString();
        }

        const updatedPurchase = await tx
          .update(salesProductPurchases)
          .set(updateData)
          .where(eq(salesProductPurchases.id, id))
          .returning();

        return updatedPurchase[0];
      });
    } catch (error) {
      console.error('Error updating sales product purchase:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update sales product purchase',
      );
    }
  }

  async remove(id: number) {
    try {
      return await this.drizzle.transaction(async (tx) => {
        // Verificar que la compra existe
        const existingPurchase = await tx.query.salesProductPurchases.findFirst(
          {
            where: eq(salesProductPurchases.id, id),
          },
        );

        if (!existingPurchase) {
          throw new NotFoundException(
            `Sales product purchase with ID ${id} not found`,
          );
        }

        // Actualizar el stock del producto (restar la cantidad de la compra)
        await tx
          .update(salesProducts)
          .set({
            currentStock: sql`${salesProducts.currentStock} - ${existingPurchase.quantity}`,
          })
          .where(eq(salesProducts.id, existingPurchase.productId));

        // Eliminar la compra
        await tx
          .delete(salesProductPurchases)
          .where(eq(salesProductPurchases.id, id));

        return {
          message: `Sales product purchase with ID ${id} deleted successfully`,
        };
      });
    } catch (error) {
      console.error('Error removing sales product purchase:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove sales product purchase',
      );
    }
  }
}
