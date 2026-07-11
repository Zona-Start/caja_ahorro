import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { tenantSettings } from '@/database/schema/tables';
import {
  products,
  productServiceSuppliers,
} from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { ProductPricesService } from '@/features/inventory/product-prices/product-prices.service';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ProductPaginationDto } from './dto/pagination-product.dto';
import { CreateProductDto, UpdateProductDto } from './dto/products.schema';

type ProductSelect = typeof products.$inferSelect;

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly generateCode: GenerateCodeService,
    private readonly productPricesService: ProductPricesService,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateProductDto,
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; sku: string; name: string; status: string }> {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, dto.categoryId),
          eq(products.name, dto.name),
          eq(products.tenantId, tenantId),
        ),
      );

    if (existing) {
      throw new BadRequestException(
        'Product with this category and name already exists',
      );
    }

    const [category] = await this.db
      .select()
      .from(schema.inventoriesCategories)
      .where(eq(schema.inventoriesCategories.id, dto.categoryId));

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const transaction = await this.db.transaction(async (tx) => {
      const code = await this.generateCode.generateGlobalCode(
        'PRD',
        tenantId,
        'inventory',
        'products',
        tx,
      );
      const [result] = await tx
        .insert(products)
        .values({
          tenantId,
          categoryId: dto.categoryId,
          internalCode: code,
          sku: dto.sku?.trim() || code,
          name: dto.name,
          description: dto.description ?? null,
          brand: dto.brand ?? null,
          model: dto.model ?? null,
          stockMin: dto.stockMin,
          stockMax: dto.stockMax,
          reorderPoint: dto.reorderPoint,
          status: dto.status as (typeof products.$inferInsert)['status'],
          unitOfMeasure: dto.unitOfMeasure ?? null,
          createdById: userId,
        })
        .returning({
          id: products.id,
          sku: products.sku,
          name: products.name,
          status: products.status,
        });

      if (
        dto.supplierCost !== 0 ||
        (dto.currencyCode && dto.currencyCode !== 'VES') ||
        (dto.salePrice ?? 0) > 0
      ) {
        const priceBase = {
          productId: result.id,
          currencyCode: dto.currencyCode as CurrencyCodeEnum,
          purchaseExchangeRate: dto.purchaseExchangeRate ?? 1,
          salesExchangeRate: dto.salesExchangeRate ?? 1,
          baseCost: dto.supplierCost ?? 0,
          otherCosts: dto.otherCosts ?? 0,
          purchaseTaxPercent: dto.purchaseTaxPercent ?? 16,
          profitPercent: dto.profitSale ?? 0,
          expensePercent: dto.expensePercent ?? 0,
          salesTaxPercent: dto.salesTaxPercent ?? 16,
          salePrice: dto.salePrice,
          offerSalePrice: dto.offerSalePrice,
          bsPriceAmount: dto.bsPriceAmount,
          isActive: true,
        };

        await this.productPricesService.create(
          { ...priceBase, priceType: 'SELLING' },
          userId,
          tenantId,
          tx,
        );

        if ((dto.profitSupply ?? 0) > 0 || (dto.offerSalePrice ?? 0) > 0) {
          const offerBase: Record<string, unknown> = dto.offerSalePrice
            ? {
                ...priceBase,
                priceType: 'OFFER' as const,
                profitPercent: 0,
                offerSalePrice: dto.offerSalePrice,
                salePrice: undefined,
                bsPriceAmount: undefined,
              }
            : {
                ...priceBase,
                priceType: 'OFFER' as const,
                profitPercent: dto.profitSupply ?? 0,
                salePrice: undefined,
                bsPriceAmount: undefined,
              };
          await this.productPricesService.create(
            {
              ...offerBase,
              startDate: dto.offerStartDate,
              endDate: dto.offerEndDate,
            } as any,
            userId,
            tenantId,
            tx,
          );
        }
      }

      if (dto.suppliers && dto.suppliers.length > 0) {
        for (const s of dto.suppliers) {
          await tx
            .insert(productServiceSuppliers)
            .values({
              tenantId,
              productId: result.id,
              suppliersId: s.suppliersId,
              leadTimeDays: s.leadTimeDays ?? 0,
            })
            .onConflictDoNothing();
        }
      }

      return result;
    });

    if (!transaction) {
      throw new BadRequestException('Product not created');
    }
    await this.auditHelper.logCreate(userId, 'product', transaction, {
      tenantId,
      targetId: transaction.id,
      description: `Created product ${transaction.name}`,
    });

    return transaction;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: ProductPaginationDto,
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
      typeCategory,
      status,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(products.name, `%${search}%`));
    }

    if (status) {
      searchConditions.push(
        eq(
          products.status,
          status as (typeof products.$inferInsert)['status'] & {},
        ),
      );
    }

    if (typeCategory) {
      searchConditions.push(eq(products.categoryId, typeCategory));
    }

    if (tenantId) {
      searchConditions.push(eq(products.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = products[sortBy as keyof typeof products];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const productData = await this.db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        categoryName: schema.inventoriesCategories.name,
        sku: products.sku,
        name: products.name,
        description: products.description,
        brand: products.brand,
        model: products.model,
        stockMin: products.stockMin,
        stockMax: products.stockMax,
        reorderPoint: products.reorderPoint,
        status: products.status,
      })
      .from(products)
      .leftJoin(
        schema.inventoriesCategories,
        eq(schema.inventoriesCategories.id, products.categoryId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const productIds = productData.map((p) => p.id);

    let prices: Record<string, unknown>[] = [];
    let availability: Record<string, unknown>[] = [];

    if (productIds.length > 0) {
      prices = await this.db
        .select({
          productId: schema.productPrices.productId,
          totalCost: schema.productPrices.totalCost,
          totalCostVes: schema.productPrices.totalCostVes,
          finalPriceNet: schema.productPrices.finalPriceNet,
          finalPriceGross: schema.productPrices.finalPriceGross,
          finalPriceNetVes: schema.productPrices.finalPriceNetVes,
          finalPriceGrossVes: schema.productPrices.finalPriceGrossVes,
          finalPrice: schema.productPrices.finalPrice,
        })
        .from(schema.productPrices)
        .where(
          and(
            inArray(schema.productPrices.productId, productIds),
            eq(schema.productPrices.isActive, true),
          ),
        );

      availability = await this.db
        .select({
          itemId: schema.inventoryAvailability.itemId,
          availableQuantity: schema.inventoryAvailability.availableQuantity,
        })
        .from(schema.inventoryAvailability)
        .where(inArray(schema.inventoryAvailability.itemId, productIds));
    }

    const pricesMap = new Map(prices.map((p) => [p.productId, p]));
    const availabilityMap = new Map(availability.map((a) => [a.itemId, a]));

    const data = productData.map((product) => {
      const priceInfo = pricesMap.get(product.id) as
        | Record<string, unknown>
        | undefined;
      const availabilityInfo = availabilityMap.get(product.id) as
        | Record<string, unknown>
        | undefined;

      return {
        ...product,
        totalCost: priceInfo?.totalCost ?? null,
        totalCostVes: priceInfo?.totalCostVes ?? null,
        finalPriceNet: priceInfo?.finalPriceNet ?? null,
        finalPriceGross: priceInfo?.finalPriceGross ?? null,
        finalPriceNetVes: priceInfo?.finalPriceNetVes ?? null,
        finalPriceGrossVes: priceInfo?.finalPriceGrossVes ?? null,
        finalPrice: priceInfo?.finalPrice ?? null,
        available: availabilityInfo?.availableQuantity ?? 0,
      };
    });

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

  async findAll(tenantId: string | null): Promise<Record<string, unknown>[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(products.tenantId, tenantId));
    }

    return this.db
      .select({
        id: products.id,
        internalCode: products.internalCode,
        name: products.name,
        sku: products.sku,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async findAllProducts(
    tenantId: string | null,
  ): Promise<Record<string, unknown>[]> {
    return this.findAll(tenantId);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<Record<string, unknown>> {
    const conditions = [eq(products.id, id)];

    if (tenantId) {
      conditions.push(eq(products.tenantId, tenantId));
    }

    const [dataProduct] = await this.db
      .select({
        id: products.id,
        tenantId: products.tenantId,
        internalCode: products.internalCode,
        categoryId: products.categoryId,
        categoryName: schema.inventoriesCategories.name,
        sku: products.sku,
        name: products.name,
        description: products.description,
        brand: products.brand,
        model: products.model,
        stockMin: products.stockMin,
        stockMax: products.stockMax,
        reorderPoint: products.reorderPoint,
        status: products.status,
        unitOfMeasure: products.unitOfMeasure,
      })
      .from(products)
      .leftJoin(
        schema.inventoriesCategories,
        eq(products.categoryId, schema.inventoriesCategories.id),
      )
      .where(and(...conditions));

    if (!dataProduct) {
      throw new NotFoundException('Product not found');
    }

    const dataProductPrices = await this.db
      .select({
        productPriceId: schema.productPrices.id,
        priceType: schema.productPrices.priceType,
        currencyCode: schema.productPrices.currencyCode,
        purchaseExchangeRate: schema.productPrices.purchaseExchangeRate,
        salesExchangeRate: schema.productPrices.salesExchangeRate,
        baseCost: schema.productPrices.baseCost,
        otherCosts: schema.productPrices.otherCosts,
        purchaseTaxPercent: schema.productPrices.purchaseTaxPercent,
        totalCost: schema.productPrices.totalCost,
        baseCostVes: schema.productPrices.baseCostVes,
        otherCostsVes: schema.productPrices.otherCostsVes,
        totalCostVes: schema.productPrices.totalCostVes,
        expensePercent: schema.productPrices.expensePercent,
        profitPercent: schema.productPrices.profitPercent,
        salesTaxPercent: schema.productPrices.salesTaxPercent,
        salePrice: schema.productPrices.salePrice,
        offerSalePrice: schema.productPrices.offerSalePrice,
        bsPriceAmount: schema.productPrices.bsPriceAmount,
        finalPriceNet: schema.productPrices.finalPriceNet,
        finalPriceGross: schema.productPrices.finalPriceGross,
        finalPriceNetVes: schema.productPrices.finalPriceNetVes,
        finalPriceGrossVes: schema.productPrices.finalPriceGrossVes,
        startDate: schema.productPrices.startDate,
        endDate: schema.productPrices.endDate,
      })
      .from(schema.productPrices)
      .where(
        and(
          eq(schema.productPrices.productId, id),
          eq(schema.productPrices.isActive, true),
        ),
      );

    const dataAvailable = await this.db
      .select()
      .from(schema.inventoryAvailability)
      .where(eq(schema.inventoryAvailability.itemId, id));

    return {
      dataProduct,
      dataProductPrices:
        dataProductPrices.length > 0 ? dataProductPrices : null,
      dataAvailable: dataAvailable[0] ?? null,
    };
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    tenantId: string | null,
    userId: string,
  ): Promise<{ id: string; sku: string; name: string; status: string }> {
    const existing = await this.findOne(id, tenantId);
    const existingProduct = existing.dataProduct as ProductSelect;

    const updateData: Record<string, unknown> = {
      updatedById: userId,
    };

    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.stockMin !== undefined) updateData.stockMin = dto.stockMin;
    if (dto.stockMax !== undefined) updateData.stockMax = dto.stockMax;
    if (dto.reorderPoint !== undefined)
      updateData.reorderPoint = dto.reorderPoint;
    if (dto.unitOfMeasure !== undefined)
      updateData.unitOfMeasure = dto.unitOfMeasure;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.sku !== undefined && dto.sku.trim())
      updateData.sku = dto.sku.trim();

    const result = await this.db.transaction(async (tx) => {
      const whereConditions = [eq(products.id, id)];
      if (tenantId) {
        whereConditions.push(eq(products.tenantId, tenantId));
      }

      const [updated] = await tx
        .update(products)
        .set(updateData)
        .where(and(...whereConditions))
        .returning({
          id: products.id,
          sku: products.sku,
          name: products.name,
          status: products.status,
        });

      if (!updated) {
        throw new NotFoundException('Product not found after update');
      }

      if (
        dto.supplierCost !== 0 ||
        (dto.currencyCode && dto.currencyCode !== 'VES') ||
        (dto.salePrice ?? 0) > 0
      ) {
        const priceBase = {
          productId: id,
          currencyCode: dto.currencyCode ?? 'VES',
          purchaseExchangeRate: dto.purchaseExchangeRate ?? 1,
          salesExchangeRate: dto.salesExchangeRate ?? 1,
          baseCost: dto.supplierCost ?? 0,
          otherCosts: dto.otherCosts ?? 0,
          purchaseTaxPercent: dto.purchaseTaxPercent ?? 16,
          profitPercent: dto.profitSale ?? 0,
          expensePercent: dto.expensePercent ?? 0,
          salesTaxPercent: dto.salesTaxPercent ?? 16,
          salePrice: dto.salePrice,
          offerSalePrice: dto.offerSalePrice,
          bsPriceAmount: dto.bsPriceAmount,
          isActive: true,
        };

        await this.productPricesService.create(
          { ...priceBase, priceType: 'SELLING' },
          userId,
          existingProduct.tenantId,
          tx,
        );

        if ((dto.profitSupply ?? 0) > 0 || (dto.offerSalePrice ?? 0) > 0) {
          const offerBase: Record<string, unknown> = dto.offerSalePrice
            ? {
                ...priceBase,
                priceType: 'OFFER' as const,
                profitPercent: 0,
                offerSalePrice: dto.offerSalePrice,
                salePrice: undefined,
                bsPriceAmount: undefined,
              }
            : {
                ...priceBase,
                priceType: 'OFFER' as const,
                profitPercent: dto.profitSupply ?? 0,
                salePrice: undefined,
                bsPriceAmount: undefined,
              };
          await this.productPricesService.create(
            {
              ...offerBase,
              startDate: dto.offerStartDate,
              endDate: dto.offerEndDate,
            } as any,
            userId,
            existingProduct.tenantId,
            tx,
          );
        }
      }

      if (dto.suppliers !== undefined) {
        await tx
          .delete(productServiceSuppliers)
          .where(eq(productServiceSuppliers.productId, id));

        for (const s of dto.suppliers) {
          await tx
            .insert(productServiceSuppliers)
            .values({
              tenantId: existingProduct.tenantId,
              productId: id,
              suppliersId: s.suppliersId,
              leadTimeDays: s.leadTimeDays ?? 0,
            })
            .onConflictDoNothing();
        }
      }

      return updated;
    });

    await this.auditHelper.logUpdate(
      userId,
      'product',
      existingProduct,
      result,
      {
        tenantId: existingProduct.tenantId,
        targetId: result.id,
        description: `Updated product ${result.name}`,
      },
    );

    return result;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);
    const existingProduct = existing.dataProduct as ProductSelect;

    const [existSale] = await this.db
      .select()
      .from(schema.creditItemSales)
      .where(eq(schema.creditItemSales.itemId, id));

    if (existSale) {
      throw new BadRequestException(
        'Cannot be deleted, there are sales of that product',
      );
    }

    const [existPurchase] = await this.db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.itemId, id));

    if (existPurchase) {
      throw new BadRequestException(
        'Cannot be deleted, there are purchases of that product',
      );
    }

    const whereConditions = [eq(products.id, id)];
    if (tenantId) {
      whereConditions.push(eq(products.tenantId, tenantId));
    }

    await this.db.delete(products).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'product', existingProduct, {
      tenantId: existingProduct.tenantId,
      targetId: id,
      description: `Deleted product ${existingProduct.name}`,
    });
  }

  async getDefaults(tenantId: string): Promise<Record<string, unknown>> {
    const keys = [
      'TAX_PURCHASES',
      'TAX_SALES',
      'UTILITY-PRODUCT',
      'EXPENDITURE-PRODUCT',
    ];
    const rows = await this.db
      .select()
      .from(tenantSettings)
      .where(
        and(
          eq(tenantSettings.tenantId, tenantId),
          inArray(tenantSettings.key, keys),
        ),
      );

    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value ?? '';
    }

    return {
      taxPurchases: Number(map.TAX_PURCHASES) || 16,
      taxSales: Number(map.TAX_SALES) || 16,
      utilityProduct: Number(map['UTILITY-PRODUCT']) || 0,
      expenditureProduct: Number(map['EXPENDITURE-PRODUCT']) || 0,
    };
  }
}
