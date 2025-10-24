import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { products } from '@/database/schema/tables';
import { priceTypeEnum, productStatus, unitOfMeasureEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gt, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { inventoryAvailability } from 'src/database/index';
import { ProductPricesService } from '../product-prices/product-prices.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCode: GenerateCodeService,
    private readonly productPricesService: ProductPricesService,
  ) {}

  async create(userId: number, data: CreateProductDto) {
    const existProduct = await this.drizzle
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, data.categoryId),
          eq(products.name, data.name),
        ),
      );

    if (existProduct.length !== 0) {
      throw new BadRequestException(
        'Product with this category and name already exists',
      );
    }

    const result = await this.drizzle
      .insert(products)
      .values({
        categoryId: data.categoryId,
        sku: await this.generateCode.generateGlobalCode('PRD'),
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model,
        stockMin: data.stockMin,
        stockMax: data.stockMax,
        reorderPoint: data.reorderPoint,
        status: data.status as (typeof products.$inferInsert)['status'],
        unitOfMeasure: data.unitType as unitOfMeasureEnum,
        createdById: userId,
      })
      .returning({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        status: products.status,
      });

    if (data.supplierCost !== 0) {
      await this.productPricesService.create(
        {
          productId: result[0].id,
          priceType: 'SELLING' as priceTypeEnum,
          baseCost: data.supplierCost,
          otherCosts: data.otherCosts,
          purchaseTax: Number(data.purchaseTax ?? undefined),
          saleTax: Number(data.saleTax ?? undefined),
          profitPercent: Number(data.profitSale ?? undefined),
          isActive: true,
        },
        userId,
      );

      if (data.profitSupply !== 0) {
        // Calculate final price based on settings
        await this.productPricesService.create(
          {
            productId: result[0].id,
            priceType: 'OFFER' as priceTypeEnum,
            baseCost: data.supplierCost,
            otherCosts: data.otherCosts,
            purchaseTax: Number(data.purchaseTax ?? undefined),
            saleTax: Number(data.saleTax ?? undefined),
            profitPercent: data.profitSupply ?? 0,
            isActive: true,
          },
          userId,
        );
      }
    }
    return result[0];
  }

  async findAllProduct() {
    return this.drizzle
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products);
  }

  async findAllProductByCredit() {
    // const rows = await this.drizzle
    //   .select({
    //     id: products.id,
    //     name: products.name,
    //     productPrice: schema.productPrices.finalPrice,
    //     availableQuantity: inventoryAvailability.availableQuantity,
    //   })
    //   .from(products)
    //   .leftJoin(
    //     schema.productPrices,
    //     eq(schema.productPrices.productId, products.id),
    //   )
    //   .leftJoin(
    //     inventoryAvailability,
    //     and(
    //       eq(inventoryAvailability.itemId, products.id),
    //       eq(inventoryAvailability.itemType, 'PRODUCT'),
    //     ),
    //   )
    //   .where(
    //     and(
    //       eq(products.status, 'AVAILABLE'),
    //       eq(schema.productPrices.isActive, true),
    //       gt(inventoryAvailability.availableQuantity, 0),
    //     ),
    //   );

    const rows = await this.drizzle
      .select({
        id: products.id,
        name: products.name,
        productPrice: schema.productPrices.finalPrice,
        availableQuantity: inventoryAvailability.availableQuantity,
      })
      .from(products)
      .leftJoin(
        schema.productPrices,
        and(
          eq(schema.productPrices.productId, products.id),
          eq(schema.productPrices.isActive, true), // <-- aquí, no en WHERE
        ),
      )
      .leftJoin(
        inventoryAvailability,
        and(
          eq(inventoryAvailability.itemId, products.id),
          eq(inventoryAvailability.itemType, 'PRODUCT'),
        ),
      )
      .where(
        and(
          eq(products.status, 'AVAILABLE'),
          gt(inventoryAvailability.availableQuantity, 0),
        ),
      );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      productPrice: r.productPrice,
      available: r.availableQuantity ?? 0,
    }));
  }

  async findAll(paginationDto: FilterProductDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      typeCategory = 0,
      status = '',
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(products.name, `%${search}%`));
    }

    if (status) {
      searchConditions.push(
        eq(products.status, status as keyof typeof productStatus),
      );
    }

    if (typeCategory !== 0) {
      searchConditions.push(eq(products.categoryId, typeCategory));
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${products[sortBy as keyof typeof products]} asc`
        : sql`${products[sortBy as keyof typeof products]} desc`;

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const productData = await this.drizzle
      .select({
        id: schema.products.id,
        categoryId: schema.products.categoryId,
        categoryName: schema.inventoriesCategories.name,
        sku: schema.products.sku,
        name: schema.products.name,
        description: schema.products.description,
        brand: schema.products.brand,
        model: schema.products.model,
        stockMin: schema.products.stockMin,
        stockMax: schema.products.stockMax,
        reorderPoint: schema.products.reorderPoint,
        status: schema.products.status,
      })
      .from(schema.products)
      .leftJoin(
        schema.inventoriesCategories,
        eq(schema.inventoriesCategories.id, schema.products.categoryId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const productIds = productData.map((p) => p.id);

    const prices = await this.drizzle
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

    const availability = await this.drizzle
      .select({
        itemId: schema.inventoryAvailability.itemId,
        availableQuantity: schema.inventoryAvailability.availableQuantity,
      })
      .from(schema.inventoryAvailability)
      .where(inArray(schema.inventoryAvailability.itemId, productIds));

    const pricesMap = new Map(prices.map((p) => [p.productId, p]));
    const availabilityMap = new Map(availability.map((a) => [a.itemId, a]));

    const data = productData.map((product) => {
      const priceInfo = pricesMap.get(product.id);
      const availabilityInfo = availabilityMap.get(product.id);

      return {
        ...product,
        totalCost: priceInfo?.totalCost || null,
        finalPrice: priceInfo?.finalPrice || null,
        available: availabilityInfo?.availableQuantity || 0,
      };
    });

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
    const dataProduct = await this.drizzle
      .select({
        id: schema.products.id,
        categoryId: schema.products.categoryId,
        categoryName: schema.inventoriesCategories.name,
        sku: schema.products.sku,
        name: schema.products.name,
        description: schema.products.description,
        brand: schema.products.brand,
        model: schema.products.model,
        stockMin: schema.products.stockMin,
        stockMax: schema.products.stockMax,
        reorderPoint: schema.products.reorderPoint,
        status: schema.products.status,
        unitType: schema.products.unitOfMeasure,
      })
      .from(products)
      .leftJoin(
        schema.inventoriesCategories,
        eq(products.categoryId, schema.inventoriesCategories.id),
      )
      .where(eq(products.id, id));

    const dataProductPrices = await this.drizzle
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

    const dataAvailable = await this.drizzle
      .select()
      .from(inventoryAvailability)
      .where(eq(inventoryAvailability.itemId, id));

    return {
      dataProduct: dataProduct[0],
      dataProductPrices: dataProductPrices ?? null,
      dataAvailable: dataAvailable[0] ?? null,
    };
  }

  async update(userId: number, id: number, data: UpdateProductDto) {
    const product = await this.drizzle
      .select()
      .from(products)
      .where(eq(schema.products.id, id));

    if (product.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const result = await this.drizzle
      .update(products)
      .set({
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model,
        stockMin: data.stockMin,
        stockMax: data.stockMax,
        reorderPoint: data.reorderPoint,
        unitOfMeasure: data.unitType as unitOfMeasureEnum,
        updatedById: userId,
        status: data.status as (typeof products.$inferInsert)['status'],
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        status: products.status,
      });

    console.log(data);

    await this.productPricesService.create(
      {
        productId: id,
        priceType: 'SELLING',
        baseCost: data.supplierCost ?? 0,
        otherCosts: data.otherCosts ?? 0,
        purchaseTax: data.purchaseTax ?? undefined,
        saleTax: data.saleTax ?? undefined,
        profitPercent: data.profitSale ?? undefined,
        isActive: true,
      },
      userId,
    );

    if ((data.profitSupply ?? 0) > 0) {
      await this.productPricesService.create(
        {
          productId: id,
          priceType: 'OFFER',
          baseCost: data.supplierCost ?? 0,
          otherCosts: data.otherCosts ?? 0,
          purchaseTax: data.purchaseTax ?? undefined,
          saleTax: data.saleTax ?? undefined,
          profitPercent: data.profitSupply ?? undefined,
          isActive: true,
        },

        userId,
      );
    }

    return result[0];
  }

  async remove(id: number) {
    const exitsProduct = await this.drizzle
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (exitsProduct.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const existSale = await this.drizzle
      .select()
      .from(schema.creditItemSales)
      .where(eq(schema.creditItemSales.itemId, id));

    if (existSale.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted, there are sales of that product',
      );
    }

    const existPurchase = await this.drizzle
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.itemId, id));

    if (existPurchase.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted, there are purschase of that product',
      );
    }

    await this.drizzle.delete(products).where(eq(products.id, id));

    return {
      message: 'Product removed successfully',
    };
  }
}
