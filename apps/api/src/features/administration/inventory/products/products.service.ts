import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { products } from '@/database/schema/administration';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { priceTypeEnum, productStatus, unitOfMeasureEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
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
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  async calculateFinalPrice(
    supplierCost: number, // price cost
    otherCosts: number, // other costs
    util: number, //utilidad en porcentaje
    purchaseTax: number, //impuesto en porcentaje compra
    saleTax: number, //impuesto venta en porcentaje
  ) {
    // Fetch rates from settings in parallel for efficiency
    const [taxRate, profitMarginRate, expenseRate] = await Promise.all([
      this.settingsSystemService.findKey('iva_venta'),
      this.settingsSystemService.findKey('utilidad_producto'),
      this.settingsSystemService.findKey('gasto_producto'),
    ]);

    // Calculate the cost including supplier cost and other costs
    const calculatedCost = supplierCost + otherCosts; // Ejemplo de cálculo
    const calculatedCostTixed = calculatedCost * (1 + (purchaseTax ?? 0) / 100);

    const price = calculatedCostTixed; //precio base sin utilidad ni impuestos
    const benefit = (price * util) / 100; //utilidad en dinero
    const expensePrice = (price * Number(expenseRate.value)) / 100; //gastos administrativos
    const priceProfit = price + benefit + expensePrice; //precio con utilidad  y gastos administrativos

    const impost = (priceProfit * (saleTax ?? 0)) / 100; //I.V.A. venta
    const maxPrice = priceProfit + impost; //precio con impuesto

    return {
      maxPrice,
      priceProfit,
      calculatedCostTixed,
      expenseRate: Number(expenseRate.value),
    };
  }

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
    const code = await this.generateCode.generateCustomReference(
      'correlativo_producto',
      'PROD',
    );

    const result = await this.drizzle
      .insert(products)
      .values({
        categoryId: data.categoryId,
        sku: code,
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model,
        stockMin: data.stockMin,
        stockMax: data.stockMax,
        reorderPoint: data.reorderPoint,
        status: 'AVAILABLE',
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
      // Calculate final price based on settings
      const resultSalePrice = await this.calculateFinalPrice(
        data.supplierCost,
        data.otherCosts,
        data.profitSale ?? 0,
        data.purchaseTax ?? 0,
        data.saleTax ?? 0,
      );

      await this.productPricesService.create(userId, {
        productId: result[0].id,
        priceType: 'SELLING' as priceTypeEnum,
        baseCost: data.supplierCost,
        otherCosts: data.otherCosts,
        purchaseTax: Number(data.purchaseTax ?? 0),
        totalCost: resultSalePrice.calculatedCostTixed,
        expensePercent: resultSalePrice.expenseRate,
        profitPercent: data.profitSale ?? 0,
        salesTaxPercent: data.saleTax ?? 0,
        finalPrice: resultSalePrice.maxPrice,
        isActive: true,
      });

      if (data.profitSupply !== 0) {
        // Calculate final price based on settings
        const resultSupplyPrice = await this.calculateFinalPrice(
          data.supplierCost,
          data.otherCosts,
          data.profitSupply ?? 0,
          data.purchaseTax ?? 0,
          data.saleTax ?? 0,
        );

        await this.productPricesService.create(userId, {
          productId: result[0].id,
          priceType: 'OFFER' as priceTypeEnum,
          baseCost: data.supplierCost,
          otherCosts: data.otherCosts,
          purchaseTax: Number(data.purchaseTax ?? 0),
          totalCost: resultSupplyPrice.calculatedCostTixed,
          expensePercent: resultSupplyPrice.expenseRate,
          profitPercent: data.profitSupply ?? 0,
          salesTaxPercent: data.saleTax ?? 0,
          finalPrice: resultSupplyPrice.maxPrice,
          isActive: true,
        });
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

    const data = await this.drizzle
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
    return {
      dataProduct: dataProduct[0],
      dataProductPrices: dataProductPrices ?? null,
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

    const activePrices =
      await this.productPricesService.findLastActivePriceByProductId(id);

    if (data.supplierCost === 0) {
      if (activePrices.length > 0) {
        const priceIds = activePrices.map((p) => p.id);
        await this.drizzle
          .update(schema.productPrices)
          .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
          .where(inArray(schema.productPrices.id, priceIds));
      }
    } else {
      const sellingPrice = activePrices.find((p) => p.priceType === 'SELLING');
      const offerPrice = activePrices.find((p) => p.priceType === 'OFFER');
      const basePriceInfo = sellingPrice || offerPrice;

      const supplierCostChanged =
        data.supplierCost !== undefined &&
        data.supplierCost !== Number(basePriceInfo?.baseCost ?? 0);
      const otherCostsChanged =
        data.otherCosts !== undefined &&
        data.otherCosts !== Number(basePriceInfo?.otherCosts ?? 0);
      const purchaseTaxChanged =
        data.purchaseTax !== undefined &&
        data.purchaseTax !== Number(basePriceInfo?.purchaseTax ?? 0);
      const saleTaxChanged =
        data.saleTax !== undefined &&
        data.saleTax !== Number(basePriceInfo?.salesTaxPercent ?? 0);
      const profitSaleChanged =
        data.profitSale !== undefined &&
        data.profitSale !== Number(sellingPrice?.profitPercent ?? 0);

      const currentOfferProfit = offerPrice
        ? Number(offerPrice.profitPercent)
        : 0;
      const newOfferProfit = data.profitSupply ?? 0;
      const profitSupplyChanged = newOfferProfit !== currentOfferProfit;

      const needsPriceUpdate =
        supplierCostChanged ||
        otherCostsChanged ||
        purchaseTaxChanged ||
        saleTaxChanged ||
        profitSaleChanged ||
        profitSupplyChanged;

      if (needsPriceUpdate) {
        if (activePrices.length > 0) {
          const priceIds = activePrices.map((p) => p.id);
          await this.drizzle
            .update(schema.productPrices)
            .set({
              isActive: false,
              updatedById: userId,
              updatedAt: new Date(),
            })
            .where(inArray(schema.productPrices.id, priceIds));
        }

        const newBaseCost =
          data.supplierCost ?? Number(basePriceInfo?.baseCost ?? 0);
        const newOtherCosts =
          data.otherCosts ?? Number(basePriceInfo?.otherCosts ?? 0);
        const newPurchaseTax =
          data.purchaseTax ?? Number(basePriceInfo?.purchaseTax ?? 0);
        const newSaleTax =
          data.saleTax ?? Number(basePriceInfo?.salesTaxPercent ?? 0);
        const newProfitSale =
          data.profitSale ?? Number(sellingPrice?.profitPercent ?? 0);
        const newProfitSupply = data.profitSupply ?? 0;

        const resultSalePrice = await this.calculateFinalPrice(
          newBaseCost,
          newOtherCosts,
          newProfitSale,
          newPurchaseTax,
          newSaleTax,
        );

        await this.productPricesService.create(userId, {
          productId: id,
          priceType: 'SELLING',
          baseCost: newBaseCost,
          otherCosts: newOtherCosts,
          purchaseTax: newPurchaseTax,
          totalCost: resultSalePrice.calculatedCostTixed,
          expensePercent: resultSalePrice.expenseRate,
          profitPercent: newProfitSale,
          salesTaxPercent: newSaleTax,
          finalPrice: resultSalePrice.maxPrice,
          isActive: true,
        });

        if (newProfitSupply > 0) {
          const resultSupplyPrice = await this.calculateFinalPrice(
            newBaseCost,
            newOtherCosts,
            newProfitSupply,
            newPurchaseTax,
            newSaleTax,
          );

          await this.productPricesService.create(userId, {
            productId: id,
            priceType: 'OFFER',
            baseCost: newBaseCost,
            otherCosts: newOtherCosts,
            purchaseTax: newPurchaseTax,
            totalCost: resultSupplyPrice.calculatedCostTixed,
            expensePercent: resultSupplyPrice.expenseRate,
            profitPercent: newProfitSupply,
            salesTaxPercent: newSaleTax,
            finalPrice: resultSupplyPrice.maxPrice,
            isActive: true,
          });
        }
      }
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
      .where(eq(schema.purchaseOrderItems.productId, id));

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
