import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { products } from '@/database/schema/administration';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { productStatus } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
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

  async calculateFinalPrice(data: { price: number }) {
    // Fetch rates from settings in parallel for efficiency
    const [taxRate, profitMarginRate, expenseRate] = await Promise.all([
      this.settingsSystemService.findKey('iva'),
      this.settingsSystemService.findKey('utilidad_producto'),
      this.settingsSystemService.findKey('gasto_producto'),
    ]);

    // Validate that rates exist and convert to numbers, defaulting to 0
    const tax = Number(taxRate?.value ?? 0);
    const profitMargin = Number(profitMarginRate?.value ?? 0);
    const expense = Number(expenseRate?.value ?? 0);

    // Calculate profit margin amount on base price
    const profitAmount = (data.price * profitMargin) / 100;
    const priceWithProfit = data.price + profitAmount;

    // Calculate tax amount on price with profit
    const taxAmount = (priceWithProfit * tax) / 100;
    const priceWithTax = priceWithProfit + taxAmount;

    // Calculate expenses/commissions on price with tax
    const expenseAmount = (priceWithTax * expense) / 100;
    const finalPrice = priceWithTax + expenseAmount;

    return finalPrice;
  }

  async create(userId: number, data: CreateProductDto) {
    const exist = await this.drizzle.query.products.findFirst({
      where: and(
        eq(products.categoryId, data.categoryId),
        eq(products.name, data.name),
      ),
    });

    if (exist) {
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
        ...data,
        sku: code,
        createdById: userId,
        status: 'AVAILABLE',
      })
      .returning({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        status: products.status,
      });

    if (data.priceType === 'COST') {
      // Calculate final price based on settings
      const finalPrice = await this.calculateFinalPrice(data);

      await this.productPricesService.create(userId, {
        productId: result[0].id,
        price: data.price,
        priceType: 'COST',
        isActive: true,
      });

      await this.productPricesService.create(userId, {
        productId: result[0].id,
        price: finalPrice,
        priceType: 'SELLING',
        isActive: true,
      });
    } else {
      await this.productPricesService.create(userId, {
        productId: result[0].id,
        price: data.price,
        priceType: data.priceType ?? 'COST',
        isActive: true,
      });
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
      searchConditions.push(eq(products.status, status as productStatus));
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
    const data = await this.drizzle.query.products.findFirst({
      where: eq(products.id, id),
      columns: {
        id: true,
        categoryId: true,
        sku: true,
        name: true,
        description: true,
        brand: true,
        model: true,
        stockMin: true,
        stockMax: true,
        reorderPoint: true,
        status: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Sales product not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateProductDto) {
    const exist = await this.drizzle.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Sales product not found');
    }

    if (data.price) {
      const lastPrice =
        await this.productPricesService.findLastActivePriceByProductId(id);
      if (lastPrice) {
        await this.productPricesService.deactivatePrice(lastPrice.id);
      }

      if (data.priceType === 'COST') {
        const finalPrice = await this.calculateFinalPrice({
          price: data.price!,
        });

        await this.productPricesService.create(userId, {
          productId: id,
          price: data.price,
          priceType: 'COST',
          isActive: true,
        });

        await this.productPricesService.create(userId, {
          productId: id,
          price: finalPrice,
          priceType: 'SELLING',
          isActive: true,
        });
      } else {
        await this.productPricesService.create(userId, {
          productId: id,
          price: data.price,
          priceType: data.priceType ?? 'COST',
          isActive: true,
        });
      }
    }

    const result = await this.drizzle
      .update(products)
      .set({
        ...data,
        updatedById: userId,
        status: data.status as productStatus,
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
    const exist = await this.drizzle.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Product not found');
    }

    const existSale = await this.drizzle
      .select()
      .from(schema.creditProductSales)
      .where(eq(schema.creditProductSales.productId, id));

    if (existSale.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted, there are sales of that product',
      );
    }

    const existPurchase = await this.drizzle
      .select()
      .from(schema.productPrices)
      .where(eq(schema.productPrices.productId, id));

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
