import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { tenants, tenantSettings } from '@/database/schema/tables';
import { moduleSettings } from '@/database/schema/tables/core';
import { productPrices } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ProductPricePaginationDto } from './dto/pagination-product-price.dto';
import { CreateProductPriceDto } from './dto/product-prices.schema';
import { computePriceBreakdown } from './pricing.util';

type ProductPriceSelect = typeof productPrices.$inferSelect;

@Injectable()
export class ProductPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  /* ───────── Leer config de tenant_settings ───────── */
  private async getTenantSetting(
    tenantId: string,
    key: string,
  ): Promise<string | null> {
    const [setting] = await this.db
      .select()
      .from(tenantSettings)
      .where(
        and(eq(tenantSettings.tenantId, tenantId), eq(tenantSettings.key, key)),
      )
      .limit(1);
    return setting?.value ?? null;
  }

  private async getModuleSetting(
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

  /* ───────── Resolución de modo de precios ───────── */
  private async resolvePricingConfig(tenantId: string) {
    const mode = await this.getTenantSetting(tenantId, 'PRICING_CURRENCY_MODE');
    const diffRates = await this.getTenantSetting(
      tenantId,
      'USE_DIFFERENTIAL_RATES',
    );

    const defaultPurchaseTax = await this.getTenantSetting(
      tenantId,
      'TAX_PURCHASES',
    );
    const defaultSalesTax = await this.getTenantSetting(tenantId, 'TAX_SALES');
    const defaultProfit = await this.getTenantSetting(
      tenantId,
      'UTILITY-PRODUCT',
    );
    const defaultExpense = await this.getTenantSetting(
      tenantId,
      'EXPENDITURE-PRODUCT',
    );

    const [tenant] = await this.db
      .select({ businessType: tenants.businessType })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const isComercial = tenant?.businessType === 'EMPRESA_COMERCIAL';

    let pricingCurrencyMode = mode;
    if (isComercial) {
      pricingCurrencyMode = 'MULTI_CURRENCY';
    } else if (!pricingCurrencyMode) {
      pricingCurrencyMode = 'SINGLE_BASE';
    }

    return {
      pricingCurrencyMode,
      useDifferentialRates: diffRates === 'true',
      defaultPurchaseTax: Number(defaultPurchaseTax),
      defaultSalesTax: Number(defaultSalesTax),
      defaultProfit: Number(defaultProfit),
      defaultExpense: Number(defaultExpense),
    };
  }

  /* ───────── Detectar cambios ───────── */
  private hasPriceChanged(
    newPrice: CreateProductPriceDto,
    currentPrice: ProductPriceSelect,
  ): boolean {
    return (
      (currentPrice?.currencyCode ?? 'VES') !==
        (newPrice.currencyCode ?? 'VES') ||
      Number(currentPrice?.baseCost ?? 0) !== newPrice.baseCost ||
      Number(currentPrice?.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(currentPrice?.purchaseTaxPercent ?? 0) !==
        (newPrice.purchaseTaxPercent ?? 16) ||
      Number(currentPrice?.salesTaxPercent ?? 0) !==
        (newPrice.salesTaxPercent ?? 16) ||
      Number(currentPrice?.profitPercent ?? 0) !==
        (newPrice.profitPercent ?? 0) ||
      Number(currentPrice?.expensePercent ?? 0) !==
        (newPrice.expensePercent ?? 0) ||
      Number(currentPrice?.salePrice ?? 0) !== (newPrice.salePrice ?? 0) ||
      Number(currentPrice?.offerSalePrice ?? 0) !==
        (newPrice.offerSalePrice ?? 0) ||
      Number(currentPrice?.purchaseExchangeRate ?? 1) !==
        (newPrice.purchaseExchangeRate ?? 1) ||
      Number(currentPrice?.salesExchangeRate ?? 1) !==
        (newPrice.salesExchangeRate ?? 1) ||
      Number(currentPrice?.bsPriceAmount ?? 0) !== (newPrice.bsPriceAmount ?? 0)
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

  private formatDate(date: string | undefined): string | undefined {
    if (!date) return undefined;
    return date;
  }

  /* ───────── Resolución de entradas nativas multi-modo ───────── */
  private async resolvePriceInputs(
    tenantId: string,
    dto: CreateProductPriceDto,
  ) {
    const config = await this.resolvePricingConfig(tenantId);

    // Resolver moneda y tasas
    let currencyCode = dto.currencyCode ?? 'VES';
    let purchaseRate = dto.purchaseExchangeRate ?? 1;
    let salesRate = dto.salesExchangeRate ?? 1;

    if (config.pricingCurrencyMode === 'SINGLE_BASE') {
      currencyCode = 'VES';
      purchaseRate = 1;
      salesRate = 1;
    } else if (!config.useDifferentialRates) {
      // MULTI_CURRENCY pero tasa unificada: usar purchaseRate para ambas
      salesRate = purchaseRate;
    }

    // Resolver porcentajes (priorizar DTO, fallback a config)
    const purchaseTaxPct = dto.purchaseTaxPercent ?? config.defaultPurchaseTax;
    const salesTaxPct = dto.salesTaxPercent ?? config.defaultSalesTax;
    const profitPct = dto.profitPercent ?? config.defaultProfit;
    const expensePct = dto.expensePercent ?? config.defaultExpense;

    // Solo persistimos la información nativa de origen y los parámetros de
    // negocio. Los importes derivados (totalCost, espejos VES, precios finales)
    // se calculan al vuelo mediante computePriceBreakdown al leer.
    return {
      currencyCode,
      purchaseExchangeRate: purchaseRate,
      salesExchangeRate: salesRate,
      baseCost: dto.baseCost,
      otherCosts: dto.otherCosts ?? 0,
      purchaseTaxPercent: purchaseTaxPct,
      profitPercent: profitPct,
      expensePercent: expensePct,
      salesTaxPercent: salesTaxPct,
      salePrice: dto.salePrice,
      offerSalePrice: dto.offerSalePrice,
      bsPriceAmount: dto.bsPriceAmount,
    };
  }

  private async insertNewPrice(
    db: NodePgDatabase<typeof schema>,
    data: CreateProductPriceDto,
    userId: string,
    resolved: Awaited<ReturnType<typeof this.resolvePriceInputs>>,
  ) {
    const valuesToInsert = {
      productId: data.productId,
      suppliersId: data.suppliersId ?? null,
      priceType: data.priceType,
      currencyCode: resolved.currencyCode as any,
      purchaseExchangeRate: String(resolved.purchaseExchangeRate),
      salesExchangeRate: String(resolved.salesExchangeRate),
      baseCost: String(resolved.baseCost),
      otherCosts: String(resolved.otherCosts),
      purchaseTaxPercent: String(resolved.purchaseTaxPercent),
      profitPercent: String(resolved.profitPercent),
      expensePercent: String(resolved.expensePercent),
      salesTaxPercent: String(resolved.salesTaxPercent),
      salePrice: data.salePrice != null ? String(data.salePrice) : null,
      offerSalePrice:
        data.offerSalePrice != null ? String(data.offerSalePrice) : null,
      bsPriceAmount:
        data.bsPriceAmount != null ? String(data.bsPriceAmount) : null,
      createdById: userId,
      isActive: true,
      startDate:
        this.formatDate(data.startDate) ??
        new Date().toISOString().split('T')[0],
      endDate: data.endDate ?? null,
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

    const resolved = await this.resolvePriceInputs(tenantId, data);
    const result = await this.insertNewPrice(db, data, userId, resolved);

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

    const searchCondition = and(...searchConditions);

    const orderByColumn = productPrices[sortBy as keyof typeof productPrices];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const rows = await this.db
      .select({
        id: schema.productPrices.id,
        productId: schema.productPrices.productId,
        productName: schema.products.name,
        supplierName: schema.suppliers.name,
        priceType: schema.productPrices.priceType,
        currencyCode: schema.productPrices.currencyCode,
        purchaseExchangeRate: schema.productPrices.purchaseExchangeRate,
        salesExchangeRate: schema.productPrices.salesExchangeRate,
        baseCost: schema.productPrices.baseCost,
        otherCosts: schema.productPrices.otherCosts,
        purchaseTaxPercent: schema.productPrices.purchaseTaxPercent,
        profitPercent: schema.productPrices.profitPercent,
        expensePercent: schema.productPrices.expensePercent,
        salesTaxPercent: schema.productPrices.salesTaxPercent,
        salePrice: schema.productPrices.salePrice,
        offerSalePrice: schema.productPrices.offerSalePrice,
        bsPriceAmount: schema.productPrices.bsPriceAmount,
        startDate: schema.productPrices.startDate,
        endDate: schema.productPrices.endDate,
        isActive: schema.productPrices.isActive,
      })
      .from(schema.productPrices)
      .leftJoin(
        schema.products,
        eq(schema.products.id, schema.productPrices.productId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    const data = rows.map((row) => ({
      ...row,
      ...computePriceBreakdown({
        currencyCode: row.currencyCode,
        priceType: row.priceType,
        purchaseExchangeRate: Number(row.purchaseExchangeRate),
        salesExchangeRate: Number(row.salesExchangeRate),
        baseCost: Number(row.baseCost),
        otherCosts: Number(row.otherCosts),
        purchaseTaxPercent: Number(row.purchaseTaxPercent),
        profitPercent: Number(row.profitPercent),
        expensePercent: Number(row.expensePercent),
        salesTaxPercent: Number(row.salesTaxPercent),
        salePrice: row.salePrice != null ? Number(row.salePrice) : undefined,
        offerSalePrice:
          row.offerSalePrice != null ? Number(row.offerSalePrice) : undefined,
        bsPriceAmount:
          row.bsPriceAmount != null ? Number(row.bsPriceAmount) : undefined,
      }),
    }));

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
