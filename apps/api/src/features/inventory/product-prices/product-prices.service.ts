import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { moduleSettings } from '@/database/schema/tables/core';
import { productPrices } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ProductPricePaginationDto } from './dto/pagination-product-price.dto';
import { CreateProductPriceDto } from './dto/product-prices.schema';

type ProductPriceSelect = typeof productPrices.$inferSelect;

@Injectable()
export class ProductPricesService {
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

  private hasPriceChanged(
    newPrice: CreateProductPriceDto,
    currentPrice: ProductPriceSelect,
  ): boolean {
    return (
      Number(currentPrice?.baseCost ?? 0) !== newPrice.baseCost ||
      Number(currentPrice?.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(currentPrice?.purchaseTax ?? 0) !== (newPrice.purchaseTax ?? 0) ||
      Number(currentPrice?.salesTaxPercent ?? 0) !== (newPrice.saleTax ?? 0) ||
      Number(currentPrice?.profitPercent ?? 0) !== (newPrice.profitPercent ?? 0)
    );
  }

  private async deactivatePrice(
    db: NodePgDatabase<typeof schema>,
    priceId: string,
    userId: string,
  ) {
    await db
      .update(schema.productPrices)
      .set({ isActive: false, updatedById: userId })
      .where(eq(schema.productPrices.id, priceId));
  }

  private async findActivePrice(
    db: NodePgDatabase<typeof schema>,
    productId: string,
    priceType: string,
  ): Promise<ProductPriceSelect | null> {
    const [price] = await db
      .select()
      .from(schema.productPrices)
      .where(
        and(
          eq(schema.productPrices.productId, productId),
          eq(
            schema.productPrices.priceType,
            priceType as (typeof schema.priceTypeEnum.enumValues)[number],
          ),
          eq(schema.productPrices.isActive, true),
        ),
      )
      .limit(1);
    return price ?? null;
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  private async calculateFinalPrice(
    tenantId: string,
    baseCost: number,
    otherCosts: number,
    purchaseTax?: number,
    saleTax?: number,
    util?: number,
  ) {
    const [salesTaxRate, purchaseTaxRate, profitMarginRate, expenseRate] =
      await Promise.all([
        this.getSettingValue(tenantId, 'inventory', 'products', 'IVA-VENTA'),
        this.getSettingValue(tenantId, 'inventory', 'products', 'IVA-COMPRA'),
        this.getSettingValue(
          tenantId,
          'inventory',
          'products',
          'UTILIDAD-PRODUCTO',
        ),
        this.getSettingValue(
          tenantId,
          'inventory',
          'products',
          'GASTO-PRODUCTO',
        ),
      ]);

    const calculatedCost = baseCost + otherCosts;
    const ip =
      calculatedCost * ((purchaseTax ?? Number(purchaseTaxRate ?? 0)) / 100);
    const calculatedCostTixed = calculatedCost + ip;

    const u =
      (calculatedCostTixed * (util ?? Number(profitMarginRate ?? 0))) / 100;
    const price = u + calculatedCostTixed;

    const gt = (price * Number(expenseRate ?? 0)) / 100;
    const expensePrice = gt + price;

    const impost =
      (expensePrice * (saleTax ?? Number(salesTaxRate ?? 0))) / 100;
    const maxPrice = expensePrice + impost;

    return {
      maxPrice,
      priceProfit: price,
      calculatedCostTixed,
      expenseRate: Number(expenseRate ?? 0),
      salesTaxRate: Number(salesTaxRate ?? 0),
      purchaseTaxRate: Number(purchaseTaxRate ?? 0),
      profitMarginRate: Number(profitMarginRate ?? 0),
    };
  }

  private async insertNewPrice(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    data: CreateProductPriceDto,
    userId: string,
  ) {
    const calculatedPrices = await this.calculateFinalPrice(
      tenantId,
      data.baseCost,
      data.otherCosts ?? 0,
      data.purchaseTax,
      data.saleTax,
      data.profitPercent,
    );

    const valuesToInsert = {
      productId: data.productId,
      suppliersId: data.suppliersId ?? null,
      priceType: data.priceType,
      baseCost: String(data.baseCost),
      otherCosts: String(data.otherCosts ?? 0),
      purchaseTax: data.purchaseTax
        ? String(data.purchaseTax)
        : String(calculatedPrices.purchaseTaxRate),
      totalCost: String(calculatedPrices.calculatedCostTixed),
      expensePercent: String(calculatedPrices.expenseRate),
      profitPercent: data.profitPercent
        ? String(data.profitPercent)
        : String(calculatedPrices.profitMarginRate),
      salesTaxPercent: data.saleTax
        ? String(data.saleTax)
        : String(calculatedPrices.salesTaxRate),
      finalPrice: String(calculatedPrices.maxPrice),
      createdById: userId,
      isActive: true,
      startDate:
        this.formatDate(data.startDate) ??
        new Date().toISOString().split('T')[0],
      endDate: this.formatDate(data.endDate) ?? null,
      supplierInvoiceId: data.supplierInvoiceId ?? null,
    };

    const [result] = await db
      .insert(schema.productPrices)
      .values(valuesToInsert)
      .returning();

    return result;
  }

  async create(
    data: CreateProductPriceDto,
    userId: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<{ message: string; data: ProductPriceSelect }> {
    const db = tx ?? this.db;

    const activePrice = await this.findActivePrice(
      db,
      data.productId,
      data.priceType,
    );

    if (activePrice && !this.hasPriceChanged(data, activePrice)) {
      return {
        message:
          'No changes detected in the product price. No update was performed.',
        data: activePrice,
      };
    }

    if (activePrice) {
      await this.deactivatePrice(db, activePrice.id, userId);
    }

    const result = await this.insertNewPrice(db, tenantId, data, userId);

    return {
      message: 'Product price created/updated successfully',
      data: result,
    };
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: ProductPricePaginationDto,
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
      productId,
      suppliersId,
      priceType,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(schema.products.name, `%${search}%`));
    }

    if (priceType) {
      searchConditions.push(
        eq(
          productPrices.priceType,
          priceType as (typeof schema.priceTypeEnum.enumValues)[number],
        ),
      );
    }

    if (productId) {
      searchConditions.push(eq(productPrices.productId, productId));
    }
    if (suppliersId) {
      searchConditions.push(eq(productPrices.suppliersId, suppliersId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = productPrices[sortBy as keyof typeof productPrices];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
      .select({
        id: schema.productPrices.id,
        productId: schema.productPrices.productId,
        productName: schema.products.name,
        suppliersId: schema.productPrices.suppliersId,
        supplierName: schema.suppliers.name,
        priceType: schema.productPrices.priceType,
        baseCost: schema.productPrices.baseCost,
        startDate: schema.productPrices.startDate,
        endDate: schema.productPrices.endDate,
        isActive: schema.productPrices.isActive,
      })
      .from(schema.productPrices)
      .leftJoin(
        schema.products,
        eq(schema.products.id, schema.productPrices.productId),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, schema.productPrices.suppliersId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(productPrices)
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

  async findOne(id: string): Promise<ProductPriceSelect> {
    const data = await this.db.query.productPrices.findFirst({
      where: eq(productPrices.id, id),
    });

    if (!data) {
      throw new NotFoundException('Product price not found');
    }

    return data;
  }
}
