import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { products } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { ProductPricesService } from '@/features/inventory/product-prices/product-prices.service';
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

    const [result] = await this.db
      .insert(products)
      .values({
        tenantId,
        categoryId: dto.categoryId,
        sku: await this.generateCode.generateGlobalCode(
          'DOC_PRD',
          tenantId,
          'inventory',
          'products',
        ),
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

    if (dto.supplierCost !== 0) {
      await this.productPricesService.create(
        {
          productId: result.id,
          priceType: 'SELLING',
          baseCost: dto.supplierCost,
          otherCosts: dto.otherCosts,
          purchaseTax: dto.purchaseTax,
          saleTax: dto.saleTax,
          profitPercent: dto.profitSale,
          isActive: true,
        },
        userId,
        tenantId,
      );

      if ((dto.profitSupply ?? 0) > 0) {
        await this.productPricesService.create(
          {
            productId: result.id,
            priceType: 'OFFER',
            baseCost: dto.supplierCost,
            otherCosts: dto.otherCosts,
            purchaseTax: dto.purchaseTax,
            saleTax: dto.saleTax,
            profitPercent: dto.profitSupply,
            isActive: true,
          },
          userId,
          tenantId,
        );
      }
    }

    await this.auditHelper.logCreate(userId, 'product', result, {
      tenantId,
      targetId: result.id,
      description: `Created product ${result.name}`,
    });

    return result;
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
        eq(products.status, status as (typeof products.$inferInsert)['status'] & {}),
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
        .where(
          inArray(
            schema.inventoryAvailability.itemId,
            productIds.map((id) => parseInt(id.replace(/-/g, '').slice(-6), 16)),
          ),
        );
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
        name: products.name,
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
        baseCost: schema.productPrices.baseCost,
        otherCosts: schema.productPrices.otherCosts,
        purchaseTax: schema.productPrices.purchaseTax,
        totalCost: schema.productPrices.totalCost,
        expensePercent: schema.productPrices.expensePercent,
        profitPercent: schema.productPrices.profitPercent,
        salesTaxPercent: schema.productPrices.salesTaxPercent,
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
      .where(
        eq(
          schema.inventoryAvailability.itemId,
          parseInt(id.replace(/-/g, '').slice(-6), 16),
        ),
      );

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

    const whereConditions = [eq(products.id, id)];
    if (tenantId) {
      whereConditions.push(eq(products.tenantId, tenantId));
    }

    const [result] = await this.db
      .update(products)
      .set(updateData)
      .where(and(...whereConditions))
      .returning({
        id: products.id,
        sku: products.sku,
        name: products.name,
        status: products.status,
      });

    if (!result) {
      throw new NotFoundException('Product not found after update');
    }

    if ((dto.supplierCost ?? 0) > 0) {
      await this.productPricesService.create(
        {
          productId: id,
          priceType: 'SELLING',
          baseCost: dto.supplierCost ?? 0,
          otherCosts: dto.otherCosts ?? 0,
          purchaseTax: dto.purchaseTax,
          saleTax: dto.saleTax,
          profitPercent: dto.profitSale,
          isActive: true,
        },
        userId,
        existingProduct.tenantId,
      );

      if ((dto.profitSupply ?? 0) > 0) {
        await this.productPricesService.create(
          {
            productId: id,
            priceType: 'OFFER',
            baseCost: dto.supplierCost ?? 0,
            otherCosts: dto.otherCosts ?? 0,
            purchaseTax: dto.purchaseTax,
            saleTax: dto.saleTax,
            profitPercent: dto.profitSupply,
            isActive: true,
          },
          userId,
          existingProduct.tenantId,
        );
      }
    }

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
      .where(eq(schema.creditItemSales.itemId, parseInt(id, 10)));

    if (existSale) {
      throw new BadRequestException(
        'Cannot be deleted, there are sales of that product',
      );
    }

    const [existPurchase] = await this.db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.itemId, parseInt(id, 10)));

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
}
