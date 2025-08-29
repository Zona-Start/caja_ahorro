import { productPrices } from '@/database/schema/administration';
import { priceTypeEnum } from '@/database/schema/enum';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { FilterProductPriceDto } from './dto/filter-product-price.dto';

@Injectable()
export class ProductPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  async calculateFinalPrice(
    baseCost: number, // price cost
    otherCosts: number, // other costs
    purchaseTax?: number, //impuesto en porcentaje compra
    saleTax?: number, //impuesto venta en porcentaje
    util?: number, //utilidad en porcentaje
  ) {
    // Fetch rates from settings in parallel for efficiency
    const [salesTaxRate, purchaseTaxRate, profitMarginRate, expenseRate] =
      await Promise.all([
        this.settingsSystemService.findKey('IVA-VENTA'),
        this.settingsSystemService.findKey('IVA-COMPRA'),
        this.settingsSystemService.findKey('UTILIDAD-PRODUCTO'),
        this.settingsSystemService.findKey('GASTO-PRODUCTO'),
      ]);

    // Calculate the cost including supplier cost and other costs
    const calculatedCost = baseCost + otherCosts; // Ejemplo de cálculo
    const calculatedCostTixed =
      calculatedCost *
      (1 + (purchaseTax ?? Number(purchaseTaxRate.value)) / 100);

    const price = calculatedCostTixed; //precio base sin utilidad ni impuestos
    const benefit = (price * (util ?? Number(profitMarginRate.value))) / 100; //utilidad en dinero
    const expensePrice = (price * Number(expenseRate.value)) / 100; //gastos administrativos
    const priceProfit = price + benefit + expensePrice; //precio con utilidad  y gastos administrativos

    const impost =
      (priceProfit * (saleTax ?? Number(salesTaxRate.value))) / 100; //I.V.A. venta
    const maxPrice = priceProfit + impost; //precio con impuesto

    return {
      maxPrice, //precio venta final
      priceProfit, //precio con utilidad  y gastos administrativos
      calculatedCostTixed, //precio compra con sus impuesto de compra
      expenseRate: Number(expenseRate.value), //gastos administrativos
      salesTaxRate: Number(salesTaxRate.value), //IVA venta
      purchaseTaxRate: Number(purchaseTaxRate.value), //IVA compra,
      profitMarginRate: Number(profitMarginRate.value), //utilidad en porcentaje)
    };
  }

  async create(
    data: CreateProductPriceDto,
    userId?: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    // const exist = await this.drizzle.query.productPrices.findFirst({
    //   where: and(
    //     eq(productPrices.productId, data.productId),
    //     eq(productPrices.priceType, data.priceType),
    //     eq(productPrices.baseCost, String(data.baseCost)),
    //     eq(productPrices.otherCosts, String(data.otherCosts)),
    //     eq(productPrices.purchaseTax, String(data.purchaseTax)),
    //   ),
    // });
    // console.log('exist', exist);

    // if (exist) {
    //   throw new BadRequestException(
    //     'Price with this product and type already exists',
    //   );
    // }

    const resultSalePrice = await this.calculateFinalPrice(
      data.baseCost,
      data.otherCosts, // other costs
      data.purchaseTax ?? undefined, //impuesto en porcentaje compra
      data.saleTax ?? undefined, //impuesto venta en porcentaje
      data.profitPercent ?? 0, //utilidad en porcentaje
    );

    const price = await db
      .insert(productPrices)
      .values({
        productId: data.productId,
        suppliersId: data.suppliersId,
        priceType: data.priceType,
        baseCost: String(data.baseCost),
        otherCosts: String(data.otherCosts),
        purchaseTax:
          String(data.purchaseTax) ?? String(resultSalePrice.purchaseTaxRate),
        totalCost: String(resultSalePrice.calculatedCostTixed),
        expensePercent: String(resultSalePrice.expenseRate),
        profitPercent:
          String(data.profitPercent) ??
          String(resultSalePrice.profitMarginRate),
        salesTaxPercent:
          String(data.saleTax) ?? String(resultSalePrice.salesTaxRate),
        finalPrice: String(resultSalePrice.maxPrice),
        createdById: userId, // Remove this line if 'createdById' is not a column in your schema
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      })
      .returning();

    return {
      message: 'Product price created successfully',
      data: price[0],
    };
  }

  async findAll(paginationDto: FilterProductPriceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      productId = 0,
      suppliersId = 0,
      priceType = '',
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(schema.products.name, `%${search}%`));
    }

    if (priceType) {
      searchConditions.push(
        eq(
          productPrices.priceType,
          priceType as (typeof priceTypeEnum.enumValues)[number],
        ),
      );
    }

    if (productId !== 0) {
      searchConditions.push(eq(productPrices.productId, productId));
    }
    if (suppliersId !== 0) {
      searchConditions.push(eq(productPrices.suppliersId, suppliersId));
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${productPrices[sortBy as keyof typeof productPrices]} asc`
        : sql`${productPrices[sortBy as keyof typeof productPrices]} desc`;

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const data = await this.drizzle
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
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(productPrices)
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
    const data = await this.drizzle.query.productPrices.findFirst({
      where: eq(productPrices.id, id),
    });

    if (!data) {
      throw new NotFoundException('Product price not found');
    }

    return data;
  }

  async findLastActivePriceByProductId(productId: number) {
    return await this.drizzle.query.productPrices.findMany({
      where: and(
        eq(productPrices.productId, productId),
        eq(productPrices.isActive, true),
      ),
      orderBy: (productPrices, { desc }) => [desc(productPrices.createdAt)],
    });
  }

  async deactivatePrice(priceId: number) {
    await this.drizzle
      .update(productPrices)
      .set({ isActive: false })
      .where(eq(productPrices.id, priceId));
  }

  // async update(userId: number, id: number, data: UpdateProductPriceDto) {
  //   const exist = await this.drizzle.query.productPrices.findFirst({
  //     where: eq(productPrices.id, id),
  //   });

  //   if (!exist) {
  //     throw new NotFoundException('Product price not found');
  //   }

  //   await this.drizzle
  //     .update(productPrices)
  //     .set({
  //       ...data,
  //       price: data.price !== undefined ? String(data.price) : undefined,
  //       startDate: data.startDate ? data.startDate.toISOString() : undefined,
  //       endDate: data.endDate ? data.endDate.toISOString() : undefined,
  //       updatedById: userId,
  //     })
  //     .where(eq(productPrices.id, id));

  //   return {
  //     message: 'Product price updated successfully',
  //   };
  // }

  // async remove(id: number) {
  //   const exist = await this.drizzle.query.productPrices.findFirst({
  //     where: eq(productPrices.id, id),
  //   });

  //   if (!exist) {
  //     throw new NotFoundException('Product price not found');
  //   }

  //   await this.drizzle.delete(productPrices).where(eq(productPrices.id, id));

  //   return {
  //     message: 'Product price removed successfully',
  //   };
  // }
}
