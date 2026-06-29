import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { moduleSettings } from '@/database/schema/tables/core';
import { fixedAssetsPrices } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateFixedAssetPriceDto } from './dto/fixed-asset-prices.schema';
import { UpdateFixedAssetPriceDto } from './dto/fixed-asset-prices.schema';
import { FixedAssetPricePaginationDto } from './dto/pagination-fixed-asset-price.dto';

type FixedAssetPriceSelect = typeof fixedAssetsPrices.$inferSelect;

@Injectable()
export class FixedAssetPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  private async getSettingValue(
    tenantId: string,
    module: string,
    submodule: string,
    key: string,
  ): Promise<string | null> {
    const [setting] = await this.db
      .select()
      .from(moduleSettings)
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, module),
          eq(moduleSettings.submodule, submodule),
          eq(moduleSettings.key, key),
        ),
      )
      .limit(1);
    return setting?.value ?? null;
  }

  private havePricesChanged(
    current: FixedAssetPriceSelect,
    newPrice: CreateFixedAssetPriceDto,
  ): boolean {
    return (
      Number(current.baseCost ?? 0) !== newPrice.baseCost ||
      Number(current.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(current.purchaseTax ?? 0) !== (newPrice.purchaseTax ?? 0)
    );
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  private async calculateFinalCost(
    tenantId: string,
    baseCost: number,
    otherCosts: number,
    purchaseTax?: number,
  ) {
    const taxRate = await this.getSettingValue(
      tenantId,
      'inventory',
      'products',
      'IVA-COMPRA',
    );
    const calculatedCost = baseCost + otherCosts;
    const taxPercentage =
      calculatedCost * ((purchaseTax ?? Number(taxRate ?? 0)) / 100);
    const finalCost = calculatedCost + taxPercentage;

    return {
      finalCost,
      taxRate: Number(taxRate ?? 0),
    };
  }

  private async handlePriceChange(
    current: FixedAssetPriceSelect,
    userId: string,
    data: CreateFixedAssetPriceDto,
    tenantId: string,
    db: NodePgDatabase<typeof schema>,
  ) {
    const lastPrice = await this.findLastActivePriceByFixedAssetId(current.fixedAssetsId, db);
    if (lastPrice) {
      await this.deactivatePrice(lastPrice.id, db);
    }
    return this.insertNewPrice(tenantId, data, userId, db);
  }

  private async insertNewPrice(
    tenantId: string,
    data: CreateFixedAssetPriceDto,
    userId: string,
    db: NodePgDatabase<typeof schema>,
  ) {
    const { finalCost, taxRate } = await this.calculateFinalCost(
      tenantId,
      data.baseCost ?? 0,
      data.otherCosts ?? 0,
      data.purchaseTax,
    );

    const [result] = await db
      .insert(schema.fixedAssetsPrices)
      .values({
        fixedAssetsId: data.fixedAssetsId,
        suppliersId: data.suppliersId ?? null,
        baseCost: String(data.baseCost ?? 0),
        otherCosts: String(data.otherCosts ?? 0),
        purchaseTax: String(data.purchaseTax ?? taxRate),
        totalCost: String(finalCost),
        createdById: userId,
        startDate:
          this.formatDate(data.startDate) ??
          new Date().toISOString().split('T')[0],
        endDate: this.formatDate(data.endDate) ?? null,
        isActive: data.isActive ?? true,
        supplierInvoiceId: data.supplierInvoiceId ?? null,
      })
      .returning();

    return {
      message: 'Fixed asset price created/updated successfully',
      data: result,
    };
  }

  async create(
    data: CreateFixedAssetPriceDto,
    userId: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    const existingPrice = await db
      .select()
      .from(schema.fixedAssetsPrices)
      .where(eq(schema.fixedAssetsPrices.fixedAssetsId, data.fixedAssetsId))
      .limit(1);

    if (existingPrice.length > 0) {
      if (this.havePricesChanged(existingPrice[0], data)) {
        return this.handlePriceChange(existingPrice[0], userId, data, tenantId, db);
      } else {
        return {
          message: 'No se detectaron cambios, precio del activo no actualizado',
          data: existingPrice[0],
        };
      }
    }

    return this.insertNewPrice(tenantId, data, userId, db);
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: FixedAssetPricePaginationDto,
  ): Promise<{
    data: Record<string, unknown>[];
    meta: Record<string, unknown>;
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      fixedAssetsId,
      suppliersId,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(schema.fixedAssets.name, `%${search}%`));
    }

    if (fixedAssetsId) {
      searchConditions.push(eq(fixedAssetsPrices.fixedAssetsId, fixedAssetsId));
    }
    if (suppliersId) {
      searchConditions.push(eq(fixedAssetsPrices.suppliersId, suppliersId));
    }

    if (tenantId) {
      searchConditions.push(eq(schema.fixedAssets.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn =
      fixedAssetsPrices[sortBy as keyof typeof fixedAssetsPrices];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
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
      .orderBy(orderByClause);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssetsPrices)
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
    tenantId?: string | null,
  ): Promise<FixedAssetPriceSelect> {
    const conditions: SQL<unknown>[] = [eq(fixedAssetsPrices.id, id)];

    if (tenantId) {
      conditions.push(eq(schema.fixedAssets.tenantId, tenantId));
    }

    const data = await this.db.query.fixedAssetsPrices.findFirst({
      where: and(...conditions),
    });

    if (!data) {
      throw new NotFoundException('Fixed asset price not found');
    }

    return data;
  }

  async findLastActivePriceByFixedAssetId(
    fixedAssetsId: string,
    db: NodePgDatabase<typeof schema>,
  ): Promise<FixedAssetPriceSelect | null> {
    const [price] = await db
      .select()
      .from(fixedAssetsPrices)
      .where(
        and(
          eq(fixedAssetsPrices.fixedAssetsId, fixedAssetsId),
          eq(fixedAssetsPrices.isActive, true),
        ),
      )
      .orderBy(sql`${fixedAssetsPrices.createdAt} desc`)
      .limit(1);

    return price ?? null;
  }

  async deactivatePrice(priceId: string, db: NodePgDatabase<typeof schema>) {
    await db
      .update(fixedAssetsPrices)
      .set({ isActive: false })
      .where(eq(fixedAssetsPrices.id, priceId));
  }

  async deactivateAllPricesForAsset(
    fixedAssetsId: string,
    db: NodePgDatabase<typeof schema>,
  ) {
    await db
      .update(fixedAssetsPrices)
      .set({ isActive: false })
      .where(eq(fixedAssetsPrices.fixedAssetsId, fixedAssetsId));
  }
}
