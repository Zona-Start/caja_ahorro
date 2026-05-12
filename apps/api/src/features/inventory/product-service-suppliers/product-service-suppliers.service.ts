import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { productServiceSuppliers } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateProductServiceSupplierDto } from './dto/product-service-suppliers.schema';
import { UpdateProductServiceSupplierDto } from './dto/product-service-suppliers.schema';
import { ProductServiceSupplierPaginationDto } from './dto/pagination-product-service-supplier.dto';

type ProductServiceSupplierSelect = typeof productServiceSuppliers.$inferSelect;

@Injectable()
export class ProductServiceSuppliersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateProductServiceSupplierDto,
    tenantId: string,
    userId: string,
  ): Promise<ProductServiceSupplierSelect> {
    const conditions: SQL<unknown>[] = [
      eq(productServiceSuppliers.suppliersId, dto.suppliersId),
    ];

    if (dto.productId) {
      conditions.push(eq(productServiceSuppliers.productId, dto.productId));
    }
    if (dto.serviceId) {
      conditions.push(eq(productServiceSuppliers.serviceId, dto.serviceId));
    }
    if (dto.fixedAssetsId) {
      conditions.push(eq(productServiceSuppliers.fixedAssetsId, dto.fixedAssetsId));
    }

    const [exist] = await this.db
      .select()
      .from(productServiceSuppliers)
      .where(and(...conditions));

    if (exist) {
      throw new BadRequestException(
        'Product/Service and Supplier relationship already exists',
      );
    }

    const [created] = await this.db
      .insert(productServiceSuppliers)
      .values({
        tenantId,
        productId: dto.productId ?? null,
        serviceId: dto.serviceId ?? null,
        fixedAssetsId: dto.fixedAssetsId ?? null,
        suppliersId: dto.suppliersId,
        leadTimeDays: dto.leadTimeDays ?? 0,
        preferred: dto.preferred ?? false,
      })
      .returning();

    await this.auditHelper.logCreate(userId, 'product_service_supplier', created, {
      tenantId,
      targetId: created.id,
      description: `Created product service supplier relationship`,
    });

    return created;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: ProductServiceSupplierPaginationDto,
  ): Promise<{ data: Record<string, unknown>[]; meta: Record<string, unknown> }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      productId,
      serviceId,
      suppliersId,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (productId) {
      searchConditions.push(eq(productServiceSuppliers.productId, productId));
    }
    if (serviceId) {
      searchConditions.push(eq(productServiceSuppliers.serviceId, serviceId));
    }
    if (suppliersId) {
      searchConditions.push(eq(productServiceSuppliers.suppliersId, suppliersId));
    }

    if (tenantId) {
      searchConditions.push(eq(productServiceSuppliers.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn =
      productServiceSuppliers[sortBy as keyof typeof productServiceSuppliers];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db.query.productServiceSuppliers.findMany({
      where: searchCondition,
      limit,
      offset,
      orderBy: orderByClause,
      with: {
        product: true,
        service: true,
        supplier: true,
      },
    });

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(productServiceSuppliers)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

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

  async findOne(id: string): Promise<ProductServiceSupplierSelect & { product?: unknown; service?: unknown; supplier?: unknown }> {
    const data = await this.db.query.productServiceSuppliers.findFirst({
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
    id: string,
    dto: UpdateProductServiceSupplierDto,
    tenantId: string | null,
    userId: string,
  ): Promise<ProductServiceSupplierSelect> {
    const existing = await this.findOne(id);

    const updateData: Record<string, unknown> = {};

    if (dto.productId !== undefined) updateData.productId = dto.productId;
    if (dto.serviceId !== undefined) updateData.serviceId = dto.serviceId;
    if (dto.fixedAssetsId !== undefined) updateData.fixedAssetsId = dto.fixedAssetsId;
    if (dto.suppliersId !== undefined) updateData.suppliersId = dto.suppliersId;
    if (dto.leadTimeDays !== undefined) updateData.leadTimeDays = dto.leadTimeDays;
    if (dto.preferred !== undefined) updateData.preferred = dto.preferred;

    const whereConditions = [eq(productServiceSuppliers.id, id)];
    if (tenantId) {
      whereConditions.push(eq(productServiceSuppliers.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(productServiceSuppliers)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException('Product service supplier not found after update');
    }

    await this.auditHelper.logUpdate(
      userId,
      'product_service_supplier',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: updated.id,
        description: `Updated product service supplier relationship`,
      },
    );

    return updated;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id);

    const whereConditions = [eq(productServiceSuppliers.id, id)];
    if (tenantId) {
      whereConditions.push(eq(productServiceSuppliers.tenantId, tenantId));
    }

    await this.db
      .delete(productServiceSuppliers)
      .where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'product_service_supplier', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted product service supplier relationship`,
    });
  }
}
