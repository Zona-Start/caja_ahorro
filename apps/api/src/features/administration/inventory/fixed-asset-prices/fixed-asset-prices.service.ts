import { fixedAssetsPrices } from '@/database/schema/administration';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateFixedAssetPriceDto } from './dto/create-fixed-asset-price.dto';
import { FilterFixedAssetPriceDto } from './dto/filter-fixed-asset-price.dto';
import { UpdateFixedAssetPriceDto } from './dto/update-fixed-asset-price.dto';

@Injectable()
export class FixedAssetPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  // --- Funciones Auxiliares ---

  private havePricesChanged(
    current: typeof schema.fixedAssetsPrices.$inferSelect,
    newPrice: CreateFixedAssetPriceDto,
  ): boolean {
    // Convierte a Number para una comparación fiable
    return (
      Number(current.baseCost ?? 0) !== newPrice.baseCost ||
      Number(current.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(current.purchaseTax ?? 0) !== (newPrice.purchaseTax ?? 0)
    );
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  }

  private async calculateFinalCost(
    baseCost: number, // base cost
    otherCosts: number, // other costs
    purchaseTax?: number, //impuesto en porcentaje factura
  ) {
    const [taxRate] = await Promise.all([
      this.settingsSystemService.findKey('IVA-COMPRA'),
    ]);
    const calculatedCost = baseCost + otherCosts; // Ejemplo de cálculo

    const taxPercentage =
      calculatedCost * ((purchaseTax ?? Number(taxRate.value)) / 100);
    const finalCost = calculatedCost + taxPercentage;

    return {
      finalCost,
      taxRate: Number(taxRate.value),
    };
  }

  private async handlePriceChange(
    current: typeof schema.fixedAssetsPrices.$inferSelect,
    userId: number,
    data: CreateFixedAssetPriceDto,
    db: NodePgDatabase<typeof schema>,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    // Desactiva el precio anterior
    const lastPrice = await this.findLastActivePriceByFixedAssetId(
      current.id,
      tx,
    );
    if (lastPrice) {
      await this.deactivatePrice(lastPrice.id, tx);
    }
    // Crea el nuevo precio
    return this.insertNewPrice(data, userId, db);
  }

  private async insertNewPrice(
    data: CreateFixedAssetPriceDto,
    userId: number,
    db: NodePgDatabase<typeof schema>,
  ) {
    // Asumiendo que 'calculateFinalCost' es un método del servicio
    const { finalCost, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts,
      data.purchaseTax ?? 0,
    );

    const result = await db
      .insert(schema.fixedAssetsPrices)
      .values({
        ...data,
        baseCost: String(data.baseCost ?? 0),
        otherCosts: String(data.otherCosts ?? 0),
        purchaseTax: String(data.purchaseTax ?? taxRate),
        totalCost: String(finalCost),
        createdById: userId,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
      })
      .returning();

    return {
      message: 'Fixed asset price created/updated successfully',
      data: result[0],
    };
  }

  async create(
    userId: number,
    data: CreateFixedAssetPriceDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const existingPrice = await db
      .select()
      .from(schema.fixedAssetsPrices)
      .where(eq(schema.fixedAssetsPrices.fixedAssetsId, data.fixedAssetsId))
      .limit(1);

    // Flujo principal: simple y directo
    if (existingPrice.length > 0) {
      if (this.havePricesChanged(existingPrice[0], data)) {
        return this.handlePriceChange(existingPrice[0], userId, data, db, tx);
      } else {
        return {
          message: 'No se detectaron cambios, precio del activo no actualizado',
          data: existingPrice[0],
        };
      }
    } else {
      return this.insertNewPrice(data, userId, db);
    }
  }

  async findAll(paginationDto: FilterFixedAssetPriceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      fixedAssetsId = 0,
      suppliersId = 0,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(schema.fixedAssets.name, `%${search}%`));
    }

    if (fixedAssetsId !== 0) {
      searchConditions.push(eq(fixedAssetsPrices.fixedAssetsId, fixedAssetsId));
    }
    if (suppliersId !== 0) {
      searchConditions.push(eq(fixedAssetsPrices.suppliersId, suppliersId));
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${fixedAssetsPrices[sortBy as keyof typeof fixedAssetsPrices]} asc`
        : sql`${fixedAssetsPrices[sortBy as keyof typeof fixedAssetsPrices]} desc`;

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const data = await this.drizzle
      .select({
        id: schema.fixedAssetsPrices.id,
        fixedAssetsId: schema.fixedAssetsPrices.fixedAssetsId,
        fixedAssetName: schema.fixedAssets.name,
        suppliersId: schema.fixedAssetsPrices.suppliersId,
        supplierName: schema.suppliers.name,
        baseCost: schema.fixedAssetsPrices.baseCost,
        startDate: schema.fixedAssetsPrices.startDate,
        endDate: schema.fixedAssetsPrices.endDate,
        isActive: schema.fixedAssetsPrices.isActive,
      })
      .from(schema.fixedAssetsPrices)
      .leftJoin(
        schema.fixedAssets,
        eq(schema.fixedAssets.id, schema.fixedAssetsPrices.fixedAssetsId),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, schema.fixedAssetsPrices.suppliersId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssetsPrices)
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
    const data = await this.drizzle.query.fixedAssetsPrices.findFirst({
      where: eq(fixedAssetsPrices.id, id),
    });

    if (!data) {
      throw new NotFoundException('Fixed asset price not found');
    }

    return data;
  }

  async findLastActivePriceByFixedAssetId(
    fixedAssetsId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    return await db.query.fixedAssetsPrices.findFirst({
      where: and(
        eq(fixedAssetsPrices.fixedAssetsId, fixedAssetsId),
        eq(fixedAssetsPrices.isActive, true),
      ),
      orderBy: (fixedAssetsPrices, { desc }) => [
        desc(fixedAssetsPrices.createdAt),
      ],
    });
  }

  async deactivatePrice(priceId: number, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.drizzle;
    await db
      .update(fixedAssetsPrices)
      .set({ isActive: false })
      .where(eq(fixedAssetsPrices.id, priceId));
  }

  async update(userId: number, id: number, data: UpdateFixedAssetPriceDto) {
    const exist = await this.drizzle.query.fixedAssetsPrices.findFirst({
      where: eq(fixedAssetsPrices.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Fixed asset price not found');
    }

    const { finalCost, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts ?? 0,
      data.purchaseTax ?? 0,
    );

    await this.drizzle
      .update(fixedAssetsPrices)
      .set({
        ...data,
        baseCost: String(data.baseCost ?? 0),
        otherCosts: String(data.otherCosts ?? 0),
        purchaseTax: String(data.purchaseTax) ?? String(taxRate),
        totalCost: String(finalCost),
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
        updatedById: userId,
      })
      .where(eq(fixedAssetsPrices.id, id));

    return {
      message: 'Fixed asset price updated successfully',
    };
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.fixedAssetsPrices.findFirst({
      where: eq(fixedAssetsPrices.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Fixed asset price not found');
    }

    await this.drizzle
      .delete(fixedAssetsPrices)
      .where(eq(fixedAssetsPrices.id, id));

    return {
      message: 'Fixed asset price removed successfully',
    };
  }
}
