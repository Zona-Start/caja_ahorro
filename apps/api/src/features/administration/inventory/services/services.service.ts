import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  purchaseOrderItems,
  services,
  supplierInvoiceItems,
} from '@/database/schema/administration';
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
import { ServicePricesService } from '../services-prices/services-prices.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly servicePricesService: ServicePricesService,
    private readonly generateCode: GenerateCodeService,
  ) {}

  async create(userId: number, data: CreateServiceDto) {
    const exitService = await this.drizzle
      .select()
      .from(services)
      .where(
        and(
          eq(services.name, data.name),
          eq(services.categoryId, data.categoryId),
        ),
      );

    if (exitService.length !== 0) {
      throw new BadRequestException(
        'Service with this name and supplier already exists',
      );
    }

    const newService = await this.drizzle.transaction(async (tx) => {
      const result = await tx
        .insert(services)
        .values([
          {
            ...data,
            serviceCode: await this.generateCode.generateGlobalCode('SRV'),
            createdById: userId,
            status: 'ACTIVE',
          },
        ])
        .returning({
          id: services.id,
          name: services.name,
          description: services.description,
          serviceCode: services.serviceCode,
          categoryId: services.categoryId,
          status: services.status,
        });

      if (data.supplierCost !== 0) {
        // Calculate final price based on settings

        await this.servicePricesService.create(
          userId,
          {
            serviceId: result[0].id,
            baseCost: data.supplierCost,
            otherCosts: data.otherCosts,
            purchaseTax: Number(data.purchaseTax ?? 0),
            startDate: new Date(),
            isActive: true,
          },
          tx,
        );
      }
      return result;
    });

    return newService[0];
  }

  async findAllPaginated(paginationDto: FilterServiceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      name,
      categoryId,
      status,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(services.name, `%${search}%`));
    }
    if (name) {
      searchConditions.push(ilike(services.name, `%${name}%`));
    }
    if (categoryId) {
      searchConditions.push(eq(services.categoryId, Number(categoryId)));
    }
    if (
      status &&
      (status === 'ACTIVE' || status === 'INACTIVE' || status === 'SUSPENDED')
    ) {
      searchConditions.push(eq(services.status, status));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${services[sortBy as keyof typeof services]} asc`
        : sql`${services[sortBy as keyof typeof services]} desc`;

    const data = await this.drizzle
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
      .orderBy(orderBy)
      .limit(limit);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(services)
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

  async findAll() {
    return await this.drizzle
      .select({
        id: services.id,
        name: services.name,
      })
      .from(services);
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        category: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Service not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateServiceDto) {
    const existService = await this.drizzle
      .select({
        id: services.id,
      })
      .from(services)
      .where(eq(services.id, id));

    if (existService.length === 0) {
      throw new NotFoundException('Service not found');
    }

    const updateService = await this.drizzle.transaction(async (tx) => {
      const result = await tx
        .update(services)
        .set({
          ...data,
          status:
            data.status === 'ACTIVE' ||
            data.status === 'INACTIVE' ||
            data.status === 'SUSPENDED'
              ? data.status
              : undefined,
          updatedById: userId,
        })
        .where(eq(services.id, id))
        .returning({
          id: services.id,
          name: services.name,
          description: services.description,
          serviceCode: services.serviceCode,
          categoryId: services.categoryId,
          status: services.status,
        });

      if (data.supplierCost !== 0) {
        // Calculate final price based on settings

        await this.servicePricesService.create(
          userId,
          {
            serviceId: id,
            baseCost: data.supplierCost ?? 0,
            otherCosts: data.otherCosts ?? 0,
            purchaseTax: Number(data.purchaseTax ?? 0),
            startDate: new Date(),
            isActive: true,
          },
          tx,
        );
      }
      return result;
    });

    return updateService[0];
  }

  async remove(id: number) {
    const exitsService = await this.drizzle
      .select()
      .from(services)
      .where(eq(services.id, id));

    if (exitsService.length === 0) {
      throw new NotFoundException('Service not found');
    }

    const exitPurchaseOrder = await this.drizzle
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.itemId, id));

    if (exitPurchaseOrder.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted has active purchase orders',
      );
    }

    const exitSupplierInvoice = await this.drizzle
      .select()
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.itemId, id));

    if (exitSupplierInvoice.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted, has active invoices received',
      );
    }

    await this.drizzle.delete(services).where(eq(services.id, id));

    return { message: 'Service removed successfully' };
  }
}
