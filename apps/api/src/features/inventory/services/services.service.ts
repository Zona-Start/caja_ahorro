import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { services } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { ServicePricesService } from '@/features/inventory/services-prices/services-prices.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ServicePaginationDto } from './dto/pagination-service.dto';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.schema';

type ServiceSelect = typeof services.$inferSelect;

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly servicePricesService: ServicePricesService,
    private readonly generateCode: GenerateCodeService,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateServiceDto,
    tenantId: string,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    serviceCode: string;
    categoryId: string;
    status: string;
  }> {
    const [existing] = await this.db
      .select()
      .from(services)
      .where(
        and(
          eq(services.name, dto.name),
          eq(services.categoryId, dto.categoryId),
          eq(services.tenantId, tenantId),
        ),
      );

    if (existing) {
      throw new BadRequestException(
        'Service with this name and category already exists',
      );
    }

    const [category] = await this.db
      .select()
      .from(schema.inventoriesCategories)
      .where(eq(schema.inventoriesCategories.id, dto.categoryId));

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const result = await this.db.transaction(async (tx) => {
      const [newService] = await tx
        .insert(services)
        .values({
          tenantId,
          name: dto.name,
          serviceCode: await this.generateCode.generateGlobalCode(
            'DOC_SRV',
            tenantId,
            'inventory',
            'services',
          ),
          categoryId: dto.categoryId,
          description: dto.description ?? null,
          status: 'ACTIVE',
          createdById: userId,
        })
        .returning({
          id: services.id,
          name: services.name,
          serviceCode: services.serviceCode,
          categoryId: services.categoryId,
          status: services.status,
        });

      if (dto.supplierCost !== 0) {
        await this.servicePricesService.create(
          {
            serviceId: newService.id,
            baseCost: dto.supplierCost,
            otherCosts: dto.otherCosts,
            purchaseTax: dto.purchaseTax,
            isActive: true,
          },
          userId,
          tenantId,
          tx,
        );
      }

      return newService;
    });

    await this.auditHelper.logCreate(userId, 'service', result, {
      tenantId,
      targetId: result.id,
      description: `Created service ${result.name}`,
    });

    return result;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: ServicePaginationDto,
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
      name,
      categoryId,
      status,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(services.name, `%${search}%`));
    }
    if (name) {
      searchConditions.push(ilike(services.name, `%${name}%`));
    }
    if (categoryId) {
      searchConditions.push(eq(services.categoryId, categoryId));
    }
    if (status) {
      searchConditions.push(
        eq(services.status, status as (typeof services.$inferInsert)['status'] & {}),
      );
    }

    if (tenantId) {
      searchConditions.push(eq(services.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = services[sortBy as keyof typeof services];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        serviceCode: services.serviceCode,
        categoryId: services.categoryId,
        categoryName: schema.inventoriesCategories.name,
        status: services.status,
        supplierCost: schema.servicePrices.baseCost,
        otherCosts: schema.servicePrices.otherCosts,
        purchaseTax: schema.servicePrices.purchaseTax,
      })
      .from(services)
      .where(searchCondition)
      .leftJoin(
        schema.inventoriesCategories,
        eq(services.categoryId, schema.inventoriesCategories.id),
      )
      .leftJoin(
        schema.servicePrices,
        and(
          eq(schema.servicePrices.serviceId, services.id),
          eq(schema.servicePrices.isActive, true),
        ),
      )
      .offset(offset)
      .orderBy(orderByClause)
      .limit(limit);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(services)
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

  async findAll(
    tenantId: string | null,
  ): Promise<{ id: string; name: string }[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(services.tenantId, tenantId));
    }

    return this.db
      .select({
        id: services.id,
        name: services.name,
      })
      .from(services)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<ServiceSelect & { category?: Record<string, unknown> | Record<string, unknown>[] }> {
    const conditions = [eq(services.id, id)];

    if (tenantId) {
      conditions.push(eq(services.tenantId, tenantId));
    }

    const data = await this.db.query.services.findFirst({
      where: and(...conditions),
      with: {
        category: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Service not found');
    }

    return data as ServiceSelect & { category?: Record<string, unknown> | Record<string, unknown>[] };
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    tenantId: string | null,
    userId: string,
  ): Promise<{ id: string; name: string; status: string }> {
    const existing = await this.findOne(id, tenantId);

    const updateData: Record<string, unknown> = {
      updatedById: userId,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.status !== undefined) updateData.status = dto.status;

    const whereConditions = [eq(services.id, id)];
    if (tenantId) {
      whereConditions.push(eq(services.tenantId, tenantId));
    }

    const [result] = await this.db
      .update(services)
      .set(updateData)
      .where(and(...whereConditions))
      .returning({
        id: services.id,
        name: services.name,
        status: services.status,
      });

    if (!result) {
      throw new NotFoundException('Service not found after update');
    }

    await this.auditHelper.logUpdate(userId, 'service', existing, result, {
      tenantId: existing.tenantId,
      targetId: result.id,
      description: `Updated service ${result.name}`,
    });

    return result;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);

    const [existPurchaseOrder] = await this.db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.itemId, id));

    if (existPurchaseOrder) {
      throw new BadRequestException(
        'Cannot be deleted has active purchase orders',
      );
    }

    const [existSupplierInvoice] = await this.db
      .select()
      .from(schema.supplierInvoiceItems)
      .where(eq(schema.supplierInvoiceItems.itemId, id));

    if (existSupplierInvoice) {
      throw new BadRequestException(
        'Cannot be deleted, has active invoices received',
      );
    }

    const whereConditions = [eq(services.id, id)];
    if (tenantId) {
      whereConditions.push(eq(services.tenantId, tenantId));
    }

    await this.db.delete(services).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'service', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted service ${existing.name}`,
    });
  }
}
