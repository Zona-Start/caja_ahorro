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

  // Método auxiliar para la lógica de comparación de un único precio
  private hasPriceChanged(
    newPrice: CreateProductPriceDto,
    currentPrice: typeof schema.productPrices.$inferSelect,
  ): boolean {
    return (
      Number(currentPrice?.baseCost ?? 0) !== newPrice.baseCost ||
      Number(currentPrice?.otherCosts ?? 0) !== newPrice.otherCosts ||
      Number(currentPrice?.purchaseTax ?? 0) !== newPrice.purchaseTax ||
      Number(currentPrice?.salesTaxPercent ?? 0) !== newPrice.saleTax ||
      Number(currentPrice?.profitPercent ?? 0) !== (newPrice.profitPercent ?? 0)
    );
  }

  /**
   * Desactiva un precio existente por su ID.
   */
  private async _deactivatePrice(
    db: NodePgDatabase<typeof schema>,
    priceId: number,
    userId: number,
  ) {
    await db
      .update(schema.productPrices)
      .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
      .where(eq(schema.productPrices.id, priceId));
  }

  /**
   * Busca el precio activo para un producto y tipo específicos.
   */
  private async _findActivePrice(
    db: NodePgDatabase<typeof schema>,
    productId: number,
    priceType: string,
  ) {
    const prices = await db
      .select()
      .from(schema.productPrices)
      .where(
        and(
          eq(schema.productPrices.productId, productId),
          eq(
            schema.productPrices.priceType,
            priceType as (typeof priceTypeEnum.enumValues)[number],
          ),
          eq(schema.productPrices.isActive, true),
        ),
      )
      .limit(1);
    return prices.length > 0 ? prices[0] : null;
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  }

  private async calculateFinalPrice(
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
    const ip =
      calculatedCost * ((purchaseTax ?? Number(purchaseTaxRate.value)) / 100);

    const calculatedCostTixed = calculatedCost + ip; //costo compra con inpuesto

    const u =
      (calculatedCostTixed * (util ?? Number(profitMarginRate.value))) / 100; //utilidad en dinero
    const price = u + calculatedCostTixed; // precio con utilidad

    const gt = (price * Number(expenseRate.value)) / 100; //gastos administrativos
    const expensePrice = gt + price; //precio con gastos administrativo

    const impost =
      (expensePrice * (saleTax ?? Number(salesTaxRate.value))) / 100; //I.V.A. venta
    const maxPrice = expensePrice + impost; //precio con impuesto

    return {
      maxPrice, //precio venta final
      priceProfit: price, //precio con utilidad  y gastos administrativos
      calculatedCostTixed, //precio compra con sus impuesto de compra
      expenseRate: Number(expenseRate.value), //gastos administrativos
      salesTaxRate: Number(salesTaxRate.value), //IVA venta
      purchaseTaxRate: Number(purchaseTaxRate.value), //IVA compra,
      profitMarginRate: Number(profitMarginRate.value), //utilidad en porcentaje)
    };
  }

  /**
   * Inserta una nueva entrada de precio en la base de datos.
   */
  private async _insertNewPrice(
    db: NodePgDatabase<typeof schema>,
    data: CreateProductPriceDto,
    userId: number,
  ) {
    // Calcula el precio final antes de insertar
    const calculatedPrices = await this.calculateFinalPrice(
      data.baseCost,
      data.otherCosts,
      data.purchaseTax,
      data.saleTax,
      data.profitPercent,
    );

    // Crea el objeto de valores a insertar.
    const valuesToInsert = {
      productId: data.productId,
      suppliersId: data.suppliersId,
      priceType: data.priceType,
      baseCost: String(data.baseCost),
      otherCosts: String(data.otherCosts),
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
      isActive: true, // El nuevo precio siempre estará activo
      startDate: this.formatDate(data.startDate) ?? new Date().toISOString(),
      endDate: this.formatDate(data.endDate),
    };

    return await db
      .insert(schema.productPrices)
      .values(valuesToInsert)
      .returning();
  }

  // Este método ahora se enfoca en crear un único tipo de precio (SELLING o OFFER)
  async create(
    data: CreateProductPriceDto,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    // 1. Busca un precio activo para el producto y tipo de precio dados.
    const activePrice = await this._findActivePrice(
      db,
      data.productId,
      data.priceType,
    );

    // 2. Si existe un precio activo y los datos de entrada son idénticos, no hacemos nada.
    if (activePrice && !this.hasPriceChanged(data, activePrice)) {
      return {
        message:
          'No se detectaron cambios en el precio del producto. No se realizó ninguna actualización.',
        data: activePrice,
      };
    }

    // 3. Si hay un precio activo que debe ser reemplazado, lo desactiva.
    if (activePrice) {
      await this._deactivatePrice(db, activePrice.id, userId);
    }

    // 4. Inserta el nuevo precio y devuelve el resultado.
    const result = await this._insertNewPrice(db, data, userId);

    return {
      message: 'Product price created/updated successfully',
      data: result[0],
    };
  }

  // async create(
  //   data: CreateProductPriceDto,
  //   userId?: number,
  //   tx?: NodePgDatabase<typeof schema>,
  // ) {
  //   const db = tx ?? this.drizzle;
  //   // const exist = await this.drizzle.query.productPrices.findFirst({
  //   //   where: and(
  //   //     eq(productPrices.productId, data.productId),
  //   //     eq(productPrices.priceType, data.priceType),
  //   //     eq(productPrices.baseCost, String(data.baseCost)),
  //   //     eq(productPrices.otherCosts, String(data.otherCosts)),
  //   //     eq(productPrices.purchaseTax, String(data.purchaseTax)),
  //   //   ),
  //   // });
  //   // console.log('exist', exist);

  //   // if (exist) {
  //   //   throw new BadRequestException(
  //   //     'Price with this product and type already exists',
  //   //   );
  //   // }

  //   const resultSalePrice = await this.calculateFinalPrice(
  //     data.baseCost,
  //     data.otherCosts, // other costs
  //     data.purchaseTax ?? undefined, //impuesto en porcentaje compra
  //     data.saleTax ?? undefined, //impuesto venta en porcentaje
  //     data.profitPercent ?? 0, //utilidad en porcentaje
  //   );

  //   const price = await db
  //     .insert(productPrices)
  //     .values({
  //       productId: data.productId,
  //       suppliersId: data.suppliersId,
  //       priceType: data.priceType,
  //       baseCost: String(data.baseCost),
  //       otherCosts: String(data.otherCosts),
  //       purchaseTax:
  //         String(data.purchaseTax) ?? String(resultSalePrice.purchaseTaxRate),
  //       totalCost: String(resultSalePrice.calculatedCostTixed),
  //       expensePercent: String(resultSalePrice.expenseRate),
  //       profitPercent:
  //         String(data.profitPercent) ??
  //         String(resultSalePrice.profitMarginRate),
  //       salesTaxPercent:
  //         String(data.saleTax) ?? String(resultSalePrice.salesTaxRate),
  //       finalPrice: String(resultSalePrice.maxPrice),
  //       createdById: userId, // Remove this line if 'createdById' is not a column in your schema
  //       startDate: data.startDate ? data.startDate.toISOString() : undefined,
  //       endDate: data.endDate ? data.endDate.toISOString() : undefined,
  //     })
  //     .returning();

  //   return {
  //     message: 'Product price created successfully',
  //     data: price[0],
  //   };
  // }

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

  // async findLastActivePriceByProductId(productId: number) {
  //   return await this.drizzle.query.productPrices.findMany({
  //     where: and(
  //       eq(productPrices.productId, productId),
  //       eq(productPrices.isActive, true),
  //     ),
  //     orderBy: (productPrices, { desc }) => [desc(productPrices.createdAt)],
  //   });
  // }

  // async deactivatePrice(priceId: number) {
  //   await this.drizzle
  //     .update(productPrices)
  //     .set({ isActive: false })
  //     .where(eq(productPrices.id, priceId));
  // }
}
