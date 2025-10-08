import { servicePrices } from '@/database/schema/tables';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateServicePriceDto } from './dto/create-services-price.dto';
import { FilterServicePriceDto } from './dto/filter-services-price.dto';

@Injectable()
export class ServicePricesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  // --- Funciones Auxiliares ---

  private havePricesChanged(
    current: typeof schema.servicePrices.$inferSelect,
    newPrice: CreateServicePriceDto,
  ): boolean {
    // Convierte a Number para una comparación fiable
    return (
      Number(current.baseCost ?? 0) !== newPrice.baseCost ||
      Number(current.otherCosts ?? 0) !== (newPrice.otherCosts ?? 0) ||
      Number(current.purchaseTax ?? 0) !== (newPrice.purchaseTax ?? 0)
    );
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  }

  private async calculateFinalCost(
    baseCost: number, // base cost
    otherCosts: number, // other costs
    purchaseTax?: number, //impuesto en porcentaje factura
  ) {
    const [taxRate] = await Promise.all([
      this.settingsSystemService.findKey('IVA-COMPRA'),
    ]);
    const calculatedCost = baseCost + otherCosts; // Ejemplo de cálculo

    const taxPercentage =
      calculatedCost * ((purchaseTax ?? Number(taxRate.value)) / 100);
    const finalCost = calculatedCost + taxPercentage;

    return {
      finalCost,
      taxRate: Number(taxRate.value),
    };
  }

  private async handlePriceChange(
    current: typeof schema.servicePrices.$inferSelect,
    userId: number,
    data: CreateServicePriceDto,
    db: NodePgDatabase<typeof schema>,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    // Desactiva el precio anterior
    const lastPrice = await this.findLastActivePriceByServiceId(current.id, tx);
    if (lastPrice) {
      await this.deactivatePrice(lastPrice.id, tx);
    }
    // Crea el nuevo precio
    return this.insertNewPrice(data, userId, db);
  }

  private async insertNewPrice(
    data: CreateServicePriceDto,
    userId: number,
    db: NodePgDatabase<typeof schema>,
  ) {
    // Asumiendo que 'calculateFinalCost' es un método del servicio
    const { finalCost, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts,
      data.purchaseTax ?? 0,
    );

    const result = await db.insert(schema.servicePrices).values({
      ...data,
      baseCost: String(data.baseCost ?? 0),
      otherCosts: String(data.otherCosts ?? 0),
      purchaseTax: String(data.purchaseTax ?? taxRate),
      totalCost: String(finalCost),
      createdById: userId,
      startDate: this.formatDate(data.startDate),
      endDate: this.formatDate(data.endDate),
      supplierInvoiceId: data.supplierInvoiceId,
    });

    return {
      message: 'Service price created/updated successfully',
      data: result[0],
    };
  }

  async create(
    userId: number,
    data: CreateServicePriceDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const existingPrice = await db
      .select()
      .from(schema.servicePrices)
      .where(eq(schema.servicePrices.serviceId, data.serviceId))
      .limit(1);

    // Flujo principal: simple y directo
    if (existingPrice.length > 0) {
      if (this.havePricesChanged(existingPrice[0], data)) {
        return this.handlePriceChange(existingPrice[0], userId, data, db, tx);
      } else {
        return {
          message: 'No se detectaron cambios, precio del activo no actualizado',
          data: existingPrice[0],
        };
      }
    } else {
      return this.insertNewPrice(data, userId, db);
    }
  }

  async findAll(paginationDto: FilterServicePriceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      serviceId = 0,
      suppliersId = 0,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(schema.products.name, `%${search}%`));
    }

    if (serviceId !== 0) {
      searchConditions.push(eq(servicePrices.serviceId, serviceId));
    }
    if (suppliersId !== 0) {
      searchConditions.push(eq(servicePrices.suppliersId, suppliersId));
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${servicePrices[sortBy as keyof typeof servicePrices]} asc`
        : sql`${servicePrices[sortBy as keyof typeof servicePrices]} desc`;

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const data = await this.drizzle
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
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(servicePrices)
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
    const data = await this.drizzle.query.servicePrices.findFirst({
      where: eq(servicePrices.id, id),
    });

    if (!data) {
      throw new NotFoundException('Service price not found');
    }

    return data;
  }

  async findLastActivePriceByServiceId(
    serviceId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    return await db.query.servicePrices.findFirst({
      where: and(
        eq(servicePrices.serviceId, serviceId),
        eq(servicePrices.isActive, true),
      ),
      orderBy: (servicePrices, { desc }) => [desc(servicePrices.createdAt)],
    });
  }

  async deactivatePrice(priceId: number, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.drizzle;
    await db
      .update(servicePrices)
      .set({ isActive: false })
      .where(eq(servicePrices.id, priceId));
  }
}
