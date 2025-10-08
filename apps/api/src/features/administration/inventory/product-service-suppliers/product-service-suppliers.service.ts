import { productServiceSuppliers } from '@/database/schema/tables';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateProductServiceSupplierDto } from './dto/create-product-service-supplier.dto';
import { FilterProductServiceSupplierDto } from './dto/filter-product-service-supplier.dto';
import { UpdateProductServiceSupplierDto } from './dto/update-product-service-supplier.dto';

@Injectable()
export class ProductServiceSuppliersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateProductServiceSupplierDto) {
    const exist = await this.drizzle.query.productServiceSuppliers.findFirst({
      where: and(
        data.productId
          ? eq(productServiceSuppliers.productId, data.productId)
          : undefined,
        data.serviceId
          ? eq(productServiceSuppliers.serviceId, data.serviceId)
          : undefined,
        eq(productServiceSuppliers.suppliersId, data.suppliersId),
      ),
    });

    if (exist) {
      throw new BadRequestException(
        'Product/Service and Supplier relationship already exists',
      );
    }

    const newProductServiceSupplier = await this.drizzle
      .insert(productServiceSuppliers)
      .values({
        ...data,
      })
      .returning();

    return newProductServiceSupplier[0];
  }

  async findAll(paginationDto: FilterProductServiceSupplierDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      productId,
      serviceId,
      suppliersId,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (productId) {
      searchConditions.push(eq(productServiceSuppliers.productId, productId));
    }
    if (serviceId) {
      searchConditions.push(eq(productServiceSuppliers.serviceId, serviceId));
    }
    if (suppliersId) {
      searchConditions.push(
        eq(productServiceSuppliers.suppliersId, suppliersId),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${productServiceSuppliers[sortBy as keyof typeof productServiceSuppliers]} asc`
        : sql`${productServiceSuppliers[sortBy as keyof typeof productServiceSuppliers]} desc`;

    const data = await this.drizzle.query.productServiceSuppliers.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: {
        product: true,
        service: true,
        supplier: true,
      },
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(productServiceSuppliers)
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
    const data = await this.drizzle.query.productServiceSuppliers.findFirst({
      where: eq(productServiceSuppliers.id, id),
      with: {
        product: true,
        service: true,
        supplier: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Product service supplier not found');
    }

    return data;
  }

  async update(
    userId: number,
    id: number,
    data: UpdateProductServiceSupplierDto,
  ) {
    const exist = await this.drizzle.query.productServiceSuppliers.findFirst({
      where: eq(productServiceSuppliers.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Product service supplier not found');
    }

    const updatedProductServiceSupplier = await this.drizzle
      .update(productServiceSuppliers)
      .set({
        ...data,
      })
      .where(eq(productServiceSuppliers.id, id))
      .returning();

    return updatedProductServiceSupplier[0];
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.productServiceSuppliers.findFirst({
      where: eq(productServiceSuppliers.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Product service supplier not found');
    }

    await this.drizzle
      .delete(productServiceSuppliers)
      .where(eq(productServiceSuppliers.id, id));

    return { message: 'Product service supplier removed successfully' };
  }
}
