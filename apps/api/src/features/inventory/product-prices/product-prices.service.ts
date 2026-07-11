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

  /* ───────── Cálculo de precios multi-modo ───────── */
  private async calculatePrices(tenantId: string, dto: CreateProductPriceDto) {
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

    // ── Bloque de Costos ──
    const baseCost = dto.baseCost;
    const otherCosts = dto.otherCosts ?? 0;
    const purchaseTaxAmount = (baseCost + otherCosts) * (purchaseTaxPct / 100);
    const totalCost = baseCost + otherCosts + purchaseTaxAmount;

    // Espejo VES (usando purchaseExchangeRate)
    const baseCostVes = +(baseCost * purchaseRate).toFixed(6);
    const otherCostsVes = +(otherCosts * purchaseRate).toFixed(6);
    const totalCostVes = +(totalCost * purchaseRate).toFixed(6);

    // ── Bloque de Venta ──
    let finalPriceNet: number;
    let finalPriceGross: number;

    if (
      currencyCode !== 'VES' &&
      dto.priceType === 'OFFER' &&
      (dto.offerSalePrice ?? 0) > 0
    ) {
      // Precio oferta directo en divisa
      finalPriceGross = dto.offerSalePrice!;
      finalPriceNet = +(finalPriceGross / (1 + salesTaxPct / 100)).toFixed(6);
    } else if (currencyCode !== 'VES' && (dto.salePrice ?? 0) > 0) {
      // Precio directo en divisa (sin cálculo por margen de ganancia)
      finalPriceGross = dto.salePrice!;
      finalPriceNet = +(finalPriceGross / (1 + salesTaxPct / 100)).toFixed(6);
    } else {
      const costPlusExpense = totalCost * (1 + expensePct / 100);
      finalPriceNet = +(costPlusExpense * (1 + profitPct / 100)).toFixed(6);
      const salesTaxAmount = finalPriceNet * (salesTaxPct / 100);
      finalPriceGross = +(finalPriceNet + salesTaxAmount).toFixed(6);
    }

    // Espejo VES (usando salesExchangeRate)
    const hasBsAmount = currencyCode !== 'VES' && (dto.bsPriceAmount ?? 0) > 0;
    const vesMultiplier = hasBsAmount ? dto.bsPriceAmount! : finalPriceGross;
    const finalPriceNetVes = +(finalPriceNet * salesRate).toFixed(6);
    const finalPriceGrossVes = +(vesMultiplier * salesRate).toFixed(6);

    return {
      currencyCode,
      purchaseExchangeRate: purchaseRate,
      salesExchangeRate: salesRate,
      baseCost,
      otherCosts,
      purchaseTaxPercent: purchaseTaxPct,
      totalCost: +totalCost.toFixed(6),
      baseCostVes,
      otherCostsVes,
      totalCostVes,
      profitPercent: profitPct,
      expensePercent: expensePct,
      salesTaxPercent: salesTaxPct,
      finalPriceNet: +finalPriceNet.toFixed(6),
      finalPriceGross: +finalPriceGross.toFixed(6),
      finalPriceNetVes,
      finalPriceGrossVes,
    };
  }

  private async insertNewPrice(
    db: NodePgDatabase<typeof schema>,
    data: CreateProductPriceDto,
    userId: string,
    calculated: Awaited<ReturnType<typeof this.calculatePrices>>,
  ) {
    const valuesToInsert = {
      productId: data.productId,
      suppliersId: data.suppliersId ?? null,
      priceType: data.priceType,
      currencyCode: calculated.currencyCode as any,
      purchaseExchangeRate: String(calculated.purchaseExchangeRate),
      salesExchangeRate: String(calculated.salesExchangeRate),
      baseCost: String(calculated.baseCost),
      otherCosts: String(calculated.otherCosts),
      purchaseTaxPercent: String(calculated.purchaseTaxPercent),
      totalCost: String(calculated.totalCost),
      baseCostVes: String(calculated.baseCostVes),
      otherCostsVes: String(calculated.otherCostsVes),
      totalCostVes: String(calculated.totalCostVes),
      profitPercent: String(calculated.profitPercent),
      expensePercent: String(calculated.expensePercent),
      salesTaxPercent: String(calculated.salesTaxPercent),
      salePrice: data.salePrice != null ? String(data.salePrice) : null,
      offerSalePrice:
        data.offerSalePrice != null ? String(data.offerSalePrice) : null,
      bsPriceAmount:
        data.bsPriceAmount != null ? String(data.bsPriceAmount) : null,
      finalPriceNet: String(calculated.finalPriceNet),
      finalPriceGross: String(calculated.finalPriceGross),
      finalPriceNetVes: String(calculated.finalPriceNetVes),
      finalPriceGrossVes: String(calculated.finalPriceGrossVes),
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

    const calculated = await this.calculatePrices(tenantId, data);
    const result = await this.insertNewPrice(db, data, userId, calculated);

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
        supplierName: schema.suppliers.name,
        priceType: schema.productPrices.priceType,
        baseCost: schema.productPrices.baseCost,
        currencyCode: schema.productPrices.currencyCode,
        purchaseExchangeRate: schema.productPrices.purchaseExchangeRate,
        salesExchangeRate: schema.productPrices.salesExchangeRate,
        totalCost: schema.productPrices.totalCost,
        totalCostVes: schema.productPrices.totalCostVes,
        finalPriceNet: schema.productPrices.finalPriceNet,
        finalPriceGross: schema.productPrices.finalPriceGross,
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
