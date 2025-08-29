import { fixedAssetsPrices } from '@/database/schema/administration';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
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
import { CreateFixedAssetPriceDto } from './dto/create-fixed-asset-price.dto';
import { FilterFixedAssetPriceDto } from './dto/filter-fixed-asset-price.dto';
import { UpdateFixedAssetPriceDto } from './dto/update-fixed-asset-price.dto';

@Injectable()
export class FixedAssetPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  async calculateFinalCost(
    supplierCost: number, // price cost
    otherCosts: number, // other costs
    purchaseTax?: number, //impuesto en porcentaje factura
  ) {
    let calculatedCostTixed = 0;
    let costFinal = 0;
    const [taxRate] = await Promise.all([
      this.settingsSystemService.findKey('IVA-COMPRA'),
    ]);
    const calculatedCost = supplierCost + otherCosts; // Ejemplo de cálculo
    if (purchaseTax === 0) {
      costFinal = calculatedCost;
    } else if (Number(taxRate.value) !== purchaseTax) {
      // Calculate the cost including supplier cost and other costs
      calculatedCostTixed = calculatedCost * (1 + (purchaseTax ?? 0) / 100);
      costFinal = calculatedCostTixed + calculatedCost;
    } else {
      calculatedCostTixed =
        calculatedCost * (1 + (Number(taxRate.value) ?? 0) / 100);
      costFinal = calculatedCostTixed + calculatedCost;
    }

    return {
      costFinal,
      taxRate: Number(taxRate.value),
    };
  }

  async create(
    userId: number,
    data: CreateFixedAssetPriceDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const exist = await db
      .select()
      .from(fixedAssetsPrices)
      .where(
        and(
          eq(fixedAssetsPrices.fixedAssetsId, data.fixedAssetsId),
          eq(fixedAssetsPrices.baseCost, String(data.baseCost)),
          eq(fixedAssetsPrices.otherCosts, String(data.otherCosts)),
          eq(fixedAssetsPrices.purchaseTax, String(data.purchaseTax)),
        ),
      );

    if (exist.length !== 0) {
      throw new BadRequestException(
        'Price with this fixed asset and base cost already exists',
      );
    }

    const { costFinal, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts,
      data.purchaseTax ?? 0,
    );

    const result = await db.insert(fixedAssetsPrices).values({
      fixedAssetsId: data.fixedAssetsId,
      suppliersId: data.suppliersId,
      baseCost: String(data.baseCost),
      otherCosts: String(data.otherCosts),
      purchaseTax: String(data.purchaseTax) ?? String(taxRate),
      totalCost: String(costFinal),
      createdById: userId,
      startDate: data.startDate
        ? data.startDate instanceof Date
          ? data.startDate.toISOString()
          : new Date(data.startDate).toISOString()
        : undefined,
      endDate: data.endDate ? data.endDate.toISOString() : undefined,
    });

    return {
      message: 'Fixed asset price created successfully',
      data: result[0],
    };
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

    const { costFinal, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts ?? 0,
      data.purchaseTax ?? 0,
    );

    await this.drizzle
      .update(fixedAssetsPrices)
      .set({
        ...data,
        baseCost:
          data.baseCost !== undefined ? String(data.baseCost) : undefined,
        otherCosts:
          data.otherCosts !== undefined ? String(data.otherCosts) : undefined,
        purchaseTax:
          data.purchaseTax !== undefined
            ? String(data.purchaseTax)
            : String(taxRate),
        totalCost: String(costFinal),
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
