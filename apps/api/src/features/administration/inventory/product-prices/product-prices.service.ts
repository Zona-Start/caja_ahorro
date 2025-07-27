import { productPrices } from '@/database/schema/administration';
import { priceTypeEnum } from '@/database/schema/enum';
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
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { FilterProductPriceDto } from './dto/filter-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

@Injectable()
export class ProductPricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateProductPriceDto) {
    const exist = await this.drizzle.query.productPrices.findFirst({
      where: and(
        eq(productPrices.productId, data.productId),
        eq(productPrices.priceType, data.priceType),
        eq(productPrices.price, String(data.price)),
      ),
    });

    if (exist) {
      throw new BadRequestException(
        'Price with this product and type already exists',
      );
    }

    await this.drizzle.insert(productPrices).values({
      ...data,
      price: String(data.price),
      createdById: userId, // Remove this line if 'createdById' is not a column in your schema
      startDate: data.startDate ? data.startDate.toISOString() : undefined,
      endDate: data.endDate ? data.endDate.toISOString() : undefined,
    });

    return {
      message: 'Product price created successfully',
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
      searchConditions.push(eq(productPrices.priceType, priceType as (typeof priceTypeEnum.enumValues)[number]));
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
        price: schema.productPrices.price,
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
    return await this.drizzle.query.productPrices.findFirst({
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
