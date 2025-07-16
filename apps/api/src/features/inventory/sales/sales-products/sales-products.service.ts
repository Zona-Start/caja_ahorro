import { salesProducts } from '@/database/schema/inventory';
import { saleProductStatus } from '@/types/enum';
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
import { CreateSalesProductDto } from './dto/create-sales-product.dto';
import { FilterSalesProductDto } from './dto/filter-sales-product.dto';
import { UpdateSalesProductDto } from './dto/update-sales-product.dto';

@Injectable()
export class SalesProductsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateSalesProductDto) {
    const exist = await this.drizzle.query.salesProducts.findFirst({
      where: eq(salesProducts.productCode, data.productCode),
    });

    if (exist) {
      throw new BadRequestException(
        'Sales product with this code already exists',
      );
    }

    await this.drizzle.insert(salesProducts).values({
      ...data,
      createdById: userId,
      defaultPurchaseCost: String(data.defaultPurchaseCost),
      defaultSellingPrice: String(data.defaultSellingPrice),
      status: 'AVAILABLE',
    });

    return {
      message: 'Sales product created successfully',
    };
  }

  async findAllProduct() {
    return this.drizzle
      .select({
        id: salesProducts.id,
        name: salesProducts.name,
      })
      .from(salesProducts);
  }

  async findAll(paginationDto: FilterSalesProductDto) {
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
      searchConditions.push(ilike(salesProducts.name, `%${search}%`));
    }

    if (status) {
      searchConditions.push(
        eq(salesProducts.status, status as saleProductStatus),
      );
    }

    if (typeCategory !== 0) {
      searchConditions.push(eq(salesProducts.categoryId, typeCategory));
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${salesProducts[sortBy as keyof typeof salesProducts]} asc`
        : sql`${salesProducts[sortBy as keyof typeof salesProducts]} desc`;

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const data = await this.drizzle
      .select({
        id: schema.salesProducts.id,
        categoryId: schema.salesProducts.categoryId,
        categoryName: schema.salesProductCategories.name,
        productCode: schema.salesProducts.productCode,
        name: schema.salesProducts.name,
        description: schema.salesProducts.description,
        brand: schema.salesProducts.brand,
        model: schema.salesProducts.model,
        defaultPurchaseCost: schema.salesProducts.defaultPurchaseCost,
        defaultSellingPrice: schema.salesProducts.defaultSellingPrice,
        currentStock: schema.salesProducts.currentStock,
        minimumStockAlert: schema.salesProducts.minimumStockAlert,
        status: schema.salesProducts.status,
      })
      .from(schema.salesProducts)
      .leftJoin(
        schema.salesProductCategories,
        eq(schema.salesProductCategories.id, schema.salesProducts.categoryId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(salesProducts)
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
    const data = await this.drizzle.query.salesProducts.findFirst({
      where: eq(salesProducts.id, id),
    });

    if (!data) {
      throw new NotFoundException('Sales product not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateSalesProductDto) {
    const exist = await this.drizzle.query.salesProducts.findFirst({
      where: eq(salesProducts.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Sales product not found');
    }

    await this.drizzle
      .update(salesProducts)
      .set({
        ...data,
        updatedById: userId,
        defaultPurchaseCost: String(data.defaultPurchaseCost),
        defaultSellingPrice: String(data.defaultSellingPrice),
        status: data.status as saleProductStatus,
      })
      .where(eq(salesProducts.id, id));

    return {
      message: 'Sales product updated successfully',
    };
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.salesProducts.findFirst({
      where: eq(salesProducts.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Sales product not found');
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

    await this.drizzle.delete(salesProducts).where(eq(salesProducts.id, id));

    return {
      message: 'Sales product removed successfully',
    };
  }
}
