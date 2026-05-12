import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { moduleSettings } from '@/database/schema/tables/core';
import { servicePrices } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ServicePricePaginationDto } from './dto/pagination-service-price.dto';
import { CreateServicePriceDto } from './dto/services-prices.schema';

type ServicePriceSelect = typeof servicePrices.$inferSelect;

@Injectable()
export class ServicePricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  private async getSettingValue(
    tenantId: string,
    module: string,
    submodule: string,
    key: string,
  ): Promise<string | null> {
    const [setting] = await this.db
      .select()
      .from(moduleSettings)
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, module),
          eq(moduleSettings.submodule, submodule),
          eq(moduleSettings.key, key),
        ),
      )
      .limit(1);
    return setting?.value ?? null;
  }

  private havePricesChanged(
    current: ServicePriceSelect,
    newPrice: CreateServicePriceDto,
  ): boolean {
    return (
      Number(current.baseCost ?? 0) !== newPrice.baseCost ||
      Number(current.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(current.purchaseTax ?? 0) !== (newPrice.purchaseTax ?? 0)
    );
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  private async calculateFinalCost(
    tenantId: string,
    baseCost: number,
    otherCosts: number,
    purchaseTax?: number,
  ) {
    const taxRate = await this.getSettingValue(
      tenantId,
      'inventory',
      'products',
      'IVA-COMPRA',
    );
    const calculatedCost = baseCost + otherCosts;
    const taxPercentage =
      calculatedCost * ((purchaseTax ?? Number(taxRate ?? 0)) / 100);
    const finalCost = calculatedCost + taxPercentage;

    return {
      finalCost,
      taxRate: Number(taxRate ?? 0),
    };
  }

  private async handlePriceChange(
    current: ServicePriceSelect,
    userId: string,
    data: CreateServicePriceDto,
    tenantId: string,
    db: NodePgDatabase<typeof schema>,
  ) {
    const lastPrice = await this.findLastActivePriceByServiceId(
      current.serviceId,
      db,
    );
    if (lastPrice) {
      await this.deactivatePrice(lastPrice.id, db);
    }
    return this.insertNewPrice(data, userId, tenantId, db);
  }

  private async insertNewPrice(
    data: CreateServicePriceDto,
    userId: string,
    tenantId: string,
    db: NodePgDatabase<typeof schema>,
  ) {
    const { finalCost, taxRate } = await this.calculateFinalCost(
      tenantId,
      data.baseCost ?? 0,
      data.otherCosts ?? 0,
      data.purchaseTax,
    );

    const [result] = await db
      .insert(schema.servicePrices)
      .values({
        serviceId: data.serviceId,
        suppliersId: data.suppliersId ?? null,
        baseCost: String(data.baseCost ?? 0),
        otherCosts: String(data.otherCosts ?? 0),
        purchaseTax: String(data.purchaseTax ?? taxRate),
        totalCost: String(finalCost),
        createdById: userId,
        startDate:
          this.formatDate(data.startDate) ??
          new Date().toISOString().split('T')[0],
        endDate: this.formatDate(data.endDate) ?? null,
        isActive: data.isActive ?? true,
        supplierInvoiceId: data.supplierInvoiceId ?? null,
      })
      .returning();

    return {
      message: 'Service price created/updated successfully',
      data: result,
    };
  }

  async create(
    dto: CreateServicePriceDto,
    userId: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    const existingPrice = await db
      .select()
      .from(schema.servicePrices)
      .where(eq(schema.servicePrices.serviceId, dto.serviceId))
      .limit(1);

    if (existingPrice.length > 0) {
      if (this.havePricesChanged(existingPrice[0], dto)) {
        return this.handlePriceChange(
          existingPrice[0],
          userId,
          dto,
          tenantId,
          db,
        );
      } else {
        return {
          message:
            'No se detectaron cambios, precio del servicio no actualizado',
          data: existingPrice[0],
        };
      }
    }

    return this.insertNewPrice(dto, userId, tenantId, db);
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: ServicePricePaginationDto,
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
      serviceId,
      suppliersId,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(schema.services.name, `%${search}%`));
    }

    if (serviceId) {
      searchConditions.push(eq(servicePrices.serviceId, serviceId));
    }
    if (suppliersId) {
      searchConditions.push(eq(servicePrices.suppliersId, suppliersId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = servicePrices[sortBy as keyof typeof servicePrices];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
      .select({
        id: schema.servicePrices.id,
        serviceId: schema.servicePrices.serviceId,
        serviceName: schema.services.name,
        suppliersId: schema.servicePrices.suppliersId,
        supplierName: schema.suppliers.name,
        baseCost: schema.servicePrices.baseCost,
        startDate: schema.servicePrices.startDate,
        endDate: schema.servicePrices.endDate,
        isActive: schema.servicePrices.isActive,
      })
      .from(schema.servicePrices)
      .leftJoin(
        schema.services,
        eq(schema.services.id, schema.servicePrices.serviceId),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, schema.servicePrices.suppliersId),
      )
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(servicePrices)
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

  async findOne(id: string): Promise<ServicePriceSelect> {
    const data = await this.db.query.servicePrices.findFirst({
      where: eq(servicePrices.id, id),
    });

    if (!data) {
      throw new NotFoundException('Service price not found');
    }

    return data;
  }

  async findLastActivePriceByServiceId(
    serviceId: string,
    db: NodePgDatabase<typeof schema>,
  ): Promise<ServicePriceSelect | null> {
    const [price] = await db
      .select()
      .from(servicePrices)
      .where(
        and(
          eq(servicePrices.serviceId, serviceId),
          eq(servicePrices.isActive, true),
        ),
      )
      .orderBy(sql`${servicePrices.createdAt} desc`)
      .limit(1);

    return price ?? null;
  }

  async deactivatePrice(priceId: string, db: NodePgDatabase<typeof schema>) {
    await db
      .update(servicePrices)
      .set({ isActive: false })
      .where(eq(servicePrices.id, priceId));
  }
}
