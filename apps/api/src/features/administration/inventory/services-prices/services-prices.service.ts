import { servicePrices } from '@/database/schema/administration';
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

  async calculateFinalCost(
    supplierCost: number, // price cost
    otherCosts: number, // other costs
    purchaseTax: number, //impuesto en porcentaje factura
  ) {
    let calculatedCostTixed = 0;
    let costFinal = 0;
    const [taxRate] = await Promise.all([
      this.settingsSystemService.findKey('iva_compra'),
    ]);
    const calculatedCost = supplierCost + otherCosts; // Ejemplo de cálculo
    if (purchaseTax === 0) {
      costFinal = calculatedCost;
    } else if (Number(taxRate.value) !== purchaseTax) {
      // Calculate the cost including supplier cost and other costs
      calculatedCostTixed = calculatedCost * (1 + (purchaseTax ?? 0) / 100);
      costFinal = calculatedCostTixed + calculatedCost;
    } else {
      calculatedCostTixed =
        calculatedCost * (1 + (Number(taxRate.value) ?? 0) / 100);
      costFinal = calculatedCostTixed + calculatedCost;
    }

    return {
      costFinal,
      taxRate: Number(taxRate.value),
    };
  }

  async create(
    userId: number,
    data: CreateServicePriceDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    // const exist = await db.query.servicePrices.findFirst({
    //   where: and(
    //     eq(servicePrices.serviceId, data.serviceId),
    //     eq(servicePrices.baseCost, String(data.baseCost)),
    //     eq(servicePrices.otherCosts, String(data.otherCosts)),
    //     eq(servicePrices.purchaseTax, String(data.purchaseTax)),
    //   ),
    // });

    // if (exist) {
    //   throw new BadRequestException(
    //     'Price with this service and type already exists',
    //   );
    // }

    const { costFinal, taxRate } = await this.calculateFinalCost(
      data.baseCost ?? 0,
      data.otherCosts,
      data.purchaseTax ?? 0,
    );

    const result = await db.insert(servicePrices).values([
      {
        serviceId: data.serviceId,
        suppliersId: data.suppliersId ?? null,
        baseCost: String(data.baseCost),
        otherCosts: String(data.otherCosts),
        purchaseTax: String(data.purchaseTax) ?? String(taxRate),
        totalCost: String(costFinal),
        createdById: userId, // Remove this line if 'createdById' is not a column in your schema
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      },
    ]);

    return {
      message: 'Service price created successfully',
      data: result[0],
    };
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
